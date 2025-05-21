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
            current_location: true,
            pickup_center: true,
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
        current_location: {
          name: string;
          code: string;
          city: string;
          country: string;
          type: string;
        };
        pickup_center?: {
          name: string;
          code: string;
          city: string;
          country: string;
          type: string;
        };
        shipment_events: {
          shipment_status: string;
          shipment_location: {
            name: string;
            code: string;
            city: string;
            country: string;
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
        is_pickup: shipment.is_pickup,
        receiver: {
          address: shipment.receiver_address,
          city: shipment.receiver_city,
          country: shipment.receiver_country,
          name: shipment.receiver_name,
          phone: shipment.receiver_phone,
          email: shipment.receiver_email,
        },
        pickup_center: shipment.pickup_center
          ? {
              name: shipment.pickup_center.name,
              city: shipment.pickup_center.city,
              country: shipment.pickup_center.country,
              type: shipment.pickup_center.type,
            }
          : null,
        current_status: shipment.current_status,
        current_location: {
          name: shipment.current_location.name,
          city: shipment.current_location.city,
          country: shipment.current_location.country,
          type: shipment.current_location.type,
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
