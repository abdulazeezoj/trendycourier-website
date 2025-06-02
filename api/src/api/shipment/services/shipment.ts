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
  origin: {
    city: string;
    country: string;
  };
  destination: {
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
  };
  progress: string;
  location?: {
    name: string;
    city: string;
    country: string;
    type: string;
  };
  events: Array<{
    progress: string;
    location: {
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
      origin: true,
      destination: true,
      pickup_center: true,
      events: {
        populate: { location: true },
        sort: "updatedAt:desc",
      },
    },
    limit: 1,
    status: "published",
  });

  if (!shipment) throw new errors.NotFoundError("Shipment not found");

  const recentEvent = shipment.events?.[0];

  return {
    tracking_code: shipment.tracking_code,
    origin: {
      city: shipment.origin.city,
      country: shipment.origin.country,
    },
    destination: {
      city: shipment.destination.city,
      country: shipment.destination.country,
    },
    is_pickup: shipment.is_pickup,
    receiver: {
      address: shipment?.receiver_address,
      city: shipment.receiver_city,
      country: shipment.receiver_country,
      name: shipment.receiver_name,
      phone: shipment.receiver_phone,
      email: shipment?.receiver_email,
    },
    pickup_center: shipment?.pickup_center
      ? {
          name: shipment.pickup_center.name,
          city: shipment.pickup_center.city,
          country: shipment.pickup_center.country,
        }
      : null,
    progress: recentEvent?.progress || null,
    location: recentEvent?.location
      ? {
          name: recentEvent.location.name,
          city: recentEvent.location.city,
          country: recentEvent.location.country,
          type: recentEvent.location.type,
        }
      : null,
    events: (shipment.events || []).map((event: any) => ({
      progress: event.progress,
      location: event?.location
        ? {
            name: event.location.name,
            city: event.location.city,
            country: event.location.country,
            type: event.location.type,
          }
        : null,
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
