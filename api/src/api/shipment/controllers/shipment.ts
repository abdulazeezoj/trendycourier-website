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

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
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
                  shipping_origin: shipmentData.shipping_origin,
                  shipping_destination: shipmentData.shipping_destination,
                  shipping_method: shipmentData.shipping_method,
                  shipment_metric: shipmentData.shipment_metric,
                  shipment_size: shipmentData.shipment_size,
                  shipment_note: shipmentData.shipment_note,
                  is_pickup: shipmentData.is_pickup === "true",
                  pickup_center: shipmentData?.pickup_center,
                },
                status: "published",
              });

            createdShipments.push(created);
          } else {
            // Optionally handle or log invalid rows
            console.warn("Skipped non-object row:", row);
          }
        }
        ctx.body = {
          count: createdShipments.length,
          data: createdShipments,
        };
        ctx.status = 201;
      } catch (err: any) {
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
