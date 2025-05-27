/**
 * shipment service
 */

import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";

export type TrackParams = {
  code: string;
};

export type TrackResult = {
  tracking_code: string;
  shipping_origin: {
    city: string;
    country: string;
  };
  shipping_destination: {
    city: string;
    country: string;
  };
  is_pickup: boolean;
  receiver: {
    address: string;
    city: string;
    country: string;
    name: string;
    phone: string;
    email: string;
  };
  pickup_center: null | {
    name: string;
    city: string;
    country: string;
    type: string;
  };
  current_status: string;
  current_location: {
    name: string;
    city: string;
    country: string;
    type: string;
  };
  events: Array<{
    shipment_status: string;
    shipment_location: {
      name: string;
      city: string;
      country: string;
      type: string;
    };
    message: string;
    timestamp: string;
  }>;
};

const track = async (
  strapi: any,
  params: TrackParams
): Promise<TrackResult> => {
  const { code } = params;

  if (!code) {
    throw new errors.ValidationError("Code is required");
  }

  const [shipment] = await strapi.documents("api::shipment.shipment").findMany({
    filters: { tracking_code: code },
    populate: {
      shipping_origin: true,
      shipping_destination: true,
      current_location: true,
      pickup_center: true,
      shipment_events: {
        populate: { shipment_location: true },
        sort: "updatedAt:desc",
      },
    },
    limit: 1,
  });

  if (!shipment) throw new errors.NotFoundError("Shipment not found");

  return {
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
};

export default factories.createCoreService(
  "api::shipment.shipment",
  ({ strapi }) => ({
    track: (params: TrackParams) => track(strapi, params),
  })
);
