/**
 * shipment controller
 */

import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import fs from "fs";
import { Context } from "koa";
import xlsx from "xlsx";
import { TrackParams, TrackResult } from "../services/shipment";

export default factories.createCoreController(
  "api::shipment.shipment",
  ({ strapi }) => ({
    async createBulk(ctx: Context) {
      const {
        request: {
          files: { file },
        },
      } = ctx;

      if (!file) {
        return ctx.badRequest("No file uploaded");
      }

      // Check if it's an array of files
      if (Array.isArray(file)) {
        return ctx.badRequest("Only one file is allowed");
      }
      // Check if the file is an Excel file
      const allowedExtensions = [".xlsx", ".xls"];
      const fileExtension = file.originalFilename
        ? file.originalFilename.split(".").pop()
        : null;
      if (!fileExtension || !allowedExtensions.includes(`.${fileExtension}`)) {
        return ctx.badRequest(
          "Invalid file type. Only Excel files are allowed"
        );
      }
      // Check if the file size is within the limit (e.g., 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return ctx.badRequest("File size exceeds the limit of 5MB");
      }
      // Check if the file is empty
      if (file.size === 0) {
        return ctx.badRequest("File is empty");
      }
      // Check if the file is readable
      try {
        fs.accessSync(file.filepath, fs.constants.R_OK);
      } catch (err) {
        return ctx.internalServerError("File is not readable");
      }
      // Check if the file is a valid Excel file
      const fileBuffer = fs.readFileSync(file.filepath);
      const workbook = xlsx.read(fileBuffer, { type: "buffer" });
      if (!workbook) {
        return ctx.badRequest("Invalid Excel file");
      }
      // Check if the file has at least one sheet
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return ctx.badRequest("Excel file has no sheets");
      }

      // Read the first sheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(worksheet);

      if (!Array.isArray(rows) || rows.length === 0) {
        return ctx.badRequest("Excel file is empty or invalid");
      }

      try {
        const createdShipments = [];
        for (const row of rows) {
          if (typeof row === "object" && row !== null && !Array.isArray(row)) {
            const shipmentData = {
              ...row,
            } as Record<string, any>;

            const created = await strapi
              .documents("api::shipment.shipment")
              .create({
                data: {
                  receiver_name: shipmentData.receiver_name,
                  receiver_phone: shipmentData.receiver_phone,
                  receiver_email: shipmentData.receiver_email,
                  receiver_address: shipmentData.receiver_address,
                  receiver_city: shipmentData.receiver_city,
                  receiver_country: shipmentData.receiver_country,
                  shipment_origin: shipmentData.shipment_origin,
                  shipment_destination: shipmentData.shipment_destination,
                  shipment_method: shipmentData.shipment_method,
                  shipment_metric: shipmentData.shipment_metric,
                  shipment_size: shipmentData.shipment_size,
                  shipment_note: shipmentData.shipment_note,
                  is_pickup: shipmentData.is_pickup === "true",
                  pickup_center: shipmentData?.pickup_center,
                },
                status: "published",
                populate: {
                  shipment_origin: true,
                  shipment_destination: true,
                  shipment_method: true,
                  shipment_metric: true,
                },
              });

            createdShipments.push(created);
          } else {
            // Optionally handle or log invalid rows
            console.warn("Skipped non-object row:", row);
          }
        }
        ctx.body = {
          data: {
            count: createdShipments.length,
            items: createdShipments.map((shipment) => ({
              id: shipment.id,
              documentId: shipment.documentId,
              tracking_code: shipment.tracking_code,
              receiver_name: shipment.receiver_name,
              receiver_phone: shipment.receiver_phone,
              receiver_email: shipment.receiver_email,
              receiver_address: shipment.receiver_address,
              receiver_city: shipment.receiver_city,
              receiver_country: shipment.receiver_country,
              shipment_note: shipment.shipment_note,
              is_pickup: shipment.is_pickup,
              shipment_size: shipment.shipment_size,
              shipment_metric: {
                id: shipment.shipment_metric.id,
                documentId: shipment.shipment_metric.documentId,
                name: shipment.shipment_metric.name,
                unit: shipment.shipment_metric.unit,
                description: shipment.shipment_metric.description,
              },
              shipment_origin: {
                id: shipment.shipment_origin.id,
                documentId: shipment.shipment_origin.documentId,
                code: shipment.shipment_origin.code,
                city: shipment.shipment_origin.city,
                country: shipment.shipment_origin.country,
              },
              shipment_destination: {
                id: shipment.shipment_destination.id,
                documentId: shipment.shipment_destination.documentId,
                code: shipment.shipment_destination.code,
                city: shipment.shipment_destination.city,
                country: shipment.shipment_destination.country,
              },
              shipment_method: {
                id: shipment.shipment_method.id,
                code: shipment.shipment_method.code,
                name: shipment.shipment_method.name,
              },
              pickup_center: {
                id: shipment.pickup_center?.id,
                documentId: shipment.pickup_center?.documentId,
                name: shipment.pickup_center?.name,
                code: shipment.pickup_center?.code,
                city: shipment.pickup_center?.city,
                country: shipment.pickup_center?.country,
                type: shipment.pickup_center?.type,
              },
              createdAt: shipment.createdAt,
              updatedAt: shipment.updatedAt,
            })),
          },
        };
        ctx.status = 201;
      } catch (err: any) {
        strapi.log.error("Error creating shipments from Excel file", err);

        return ctx.internalServerError(
          "Failed to create shipments from Excel file"
        );
      }
    },
    async track(ctx: Context) {
      const { code } = ctx.query;

      try {
        const result: TrackResult = await strapi
          .service("api::shipment.shipment")
          .track({ code } as TrackParams);

        ctx.body = result;
        ctx.status = 200;
      } catch (err: any) {
        if (err instanceof errors.ValidationError) {
          return ctx.badRequest(err.message);
        } else if (err instanceof errors.NotFoundError) {
          return ctx.notFound(err.message);
        } else {
          return ctx.internalServerError(
            "An error occurred while tracking shipment"
          );
        }
      }
    },
  })
);
