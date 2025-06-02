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
                  origin: shipmentData.origin,
                  destination: shipmentData.destination,
                  method: shipmentData.method,
                  metric: shipmentData.metric,
                  size: shipmentData.size,
                  note: shipmentData.note,
                  is_pickup: shipmentData.is_pickup === "true",
                  pickup_center: shipmentData?.pickup_center,
                },
                status: "published",
                populate: {
                  origin: true,
                  destination: true,
                  method: true,
                  metric: true,
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
              note: shipment.note,
              is_pickup: shipment.is_pickup,
              size: shipment.size,
              metric: {
                id: shipment.metric.id,
                documentId: shipment.metric.documentId,
                name: shipment.metric.name,
                unit: shipment.metric.unit,
                description: shipment.metric.description,
              },
              origin: {
                id: shipment.origin.id,
                documentId: shipment.origin.documentId,
                code: shipment.origin.code,
                city: shipment.origin.city,
                country: shipment.origin.country,
              },
              destination: {
                id: shipment.destination.id,
                documentId: shipment.destination.documentId,
                code: shipment.destination.code,
                city: shipment.destination.city,
                country: shipment.destination.country,
              },
              method: {
                id: shipment.method.id,
                code: shipment.method.code,
                name: shipment.method.name,
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
        console.error("Error tracking shipment:", err);
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
