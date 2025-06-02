import { type Event } from "@strapi/database/dist/lifecycles";
import { getConnectRelationId, getSetRelationId } from "../../../../utils/helpers";

export default {
  async afterCreate(event: Event) {
    const { data } = event.params;

    // Skip Draft & Publish secondary invocation
    if (data.publishedAt) return;

    const [shipmentLocationId] = getConnectRelationId(data.location);
    const [shipmentId] = getConnectRelationId(data.shipment);

    if (!shipmentId) {
      strapi.log.error("Shipment relation missing in event.");
      throw new Error("Shipment relation missing.");
    }

    const [shipment] = await strapi
      .documents("api::shipment.shipment")
      .findMany({
        filters: { id: shipmentId },
        populate: {
          pickup_center: true,
        },
        limit: 1,
      });

    if (!shipment) {
      strapi.log.error("Shipment not found.");
      throw new Error("Shipment not found.");
    }

    // Only lookup shipmentLocation if ID exists
    let shipmentLocation: any;
    if (shipmentLocationId) {
      const [location] = await strapi
        .documents("api::shipment-location.shipment-location")
        .findMany({
          filters: { id: shipmentLocationId },
          limit: 1,
        });

      if (location) {
        shipmentLocation = location;
      }

      // If location not found, log warning but continue
      if (!location && data.shipment_status !== "Delivered") {
        strapi.log.warn(
          "Shipment location not found, but not required for this status."
        );
      }
    }

    // Notify shipment status
    await strapi
      .service("api::shipment-event.shipment-event")
      .notifyShipmentStatus({
        shipment: shipment,
        shipment_event: data,
      });
  },
};
