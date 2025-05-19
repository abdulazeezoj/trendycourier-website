/**
 * shipment controller
 */

import { factories } from "@strapi/strapi";
import { Context } from "koa";

export default factories.createCoreController(
  "api::shipment.shipment",
  ({ strapi }) => ({
    async track(ctx: Context) {
      const { code } = ctx.query;

      // Validate the code
      if (!code) {
        return ctx.badRequest("Code is required");
      }

      // Fetch the shipment using the tracking code
      const [shipmentRaw] = await strapi.entityService.findMany(
        "api::shipment.shipment",
        {
          filters: { tracking_code: code },
          populate: {
            shipping_origin: true,
            shipping_destination: true,
            shipment_location: true,
            shipment_events: {
              populate: {
                shipment_location: true,
              },
              sort: "updatedAt:desc",
            },
          },
          limit: 1,
        }
      );

      if (!shipmentRaw) return ctx.notFound("Shipment not found");

      const shipment = shipmentRaw as typeof shipmentRaw & {
        shipping_origin: {
          code: string;
          city: string;
          country: string;
        };
        shipping_destination: {
          code: string;
          city: string;
          country: string;
        };
        shipment_location: {
          name: string;
          code: string;
          city: string;
          country: string;
          notes?: string;
          type: string;
        };
        shipment_events: {
          shipment_status: string;
          shipment_location: {
            name: string;
            code: string;
            city: string;
            country: string;
            notes?: string;
            type: string;
          };
          message: string;
          updatedAt: string;
        }[];
      };

      ctx.body = {
        tracking_code: shipment.tracking_code,
        shipping_origin: {
          city: shipment.shipping_origin.city,
          country: shipment.shipping_origin.country,
        },
        shipping_destination: {
          city: shipment.shipping_destination.city,
          country: shipment.shipping_destination.country,
        },
        shipment_status: shipment.shipment_status,
        shipment_location: {
          name: shipment.shipment_location.name,
          city: shipment.shipment_location.city,
          country: shipment.shipment_location.country,
          type: shipment.shipment_location.type,
        },
        events: (shipment.shipment_events || []).map((event: any) => ({
          shipment_status: event.shipment_status,
          shipment_location: {
            name: event.shipment_location.name,
            city: event.shipment_location.city,
            country: event.shipment_location.country,
            type: event.shipment_location.type,
          },
          message: event.message,
          timestamp: event.updatedAt,
        })),
      };
    },
  })
);
