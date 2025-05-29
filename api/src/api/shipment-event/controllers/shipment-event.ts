/**
 * shipment-event controller
 */

import { factories } from "@strapi/strapi";
import fs from "fs";
import { Context } from "koa";
import xlsx from "xlsx";
import { toTitleCase } from "../../../utils/helpers";

export default factories.createCoreController(
  "api::shipment-event.shipment-event",
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
        const createdShipmentEvents = [];

        for (const row of rows) {
          if (typeof row === "object" && row !== null && !Array.isArray(row)) {
            const shipmentEventData = {
              ...row,
            } as Record<string, any>;

            const created = await strapi
              .documents("api::shipment-event.shipment-event")
              .create({
                data: {
                  shipment: shipmentEventData.shipment,
                  shipment_status: toTitleCase(
                    shipmentEventData.shipment_status
                  ) as any,
                  message: shipmentEventData.message,
                  shipment_location: shipmentEventData.shipment_location,
                },
                status: "published",
                populate: {
                  shipment: true,
                  shipment_location: true,
                },
              });

            createdShipmentEvents.push(created);
          } else {
            // Optionally handle or log invalid rows
            console.warn("Skipped non-object row:", row);
          }
        }
        ctx.body = {
          data: {
            count: createdShipmentEvents.length,
            items: createdShipmentEvents.map((item) => ({
              id: item.id,
              documentId: item.documentId,
              shipment_status: item.shipment_status,
              message: item.message,
              shipment: {
                id: item.shipment.id,
                documentId: item.shipment.documentId,
                tracking_code: item.shipment.tracking_code,
              },
              shipment_location: {
                id: item.shipment_location.id,
                documentId: item.shipment_location.documentId,
                name: item.shipment_location.name,
                code: item.shipment_location.code,
                city: item.shipment_location.city,
                country: item.shipment_location.country,
                type: item.shipment_location.type,
              },
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            })),
          },
        };
        ctx.status = 201;
      } catch (err: any) {
        strapi.log.error("Error creating shipment events from Excel file", err);

        return ctx.internalServerError(
          "Failed to create shipment events from Excel file"
        );
      }
    },
  })
);
