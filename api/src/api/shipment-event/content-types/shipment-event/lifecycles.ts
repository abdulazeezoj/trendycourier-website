import { type Event } from "@strapi/database/dist/lifecycles";

export default {
  async afterCreate(event: Event) {
    const { data } = event.params;

    // Skip Draft & Publish secondary invocation
    if (data.publishedAt) return;

    const getId = (rel: any) => rel?.connect?.[0]?.id;

    const shipmentLocationId = getId(data.shipment_location);
    const shipmentId = getId(data.shipment);

    if (!shipmentId) {
      strapi.log.error("❌ Shipment relation missing in event.");
      throw new Error("Shipment relation missing.");
    }

    const [shipment] = await strapi
      .documents("api::shipment.shipment")
      .findMany({
        filters: { id: shipmentId },
        limit: 1,
      });

    if (!shipment) {
      strapi.log.error("❌ Shipment not found.");
      throw new Error("Shipment not found.");
    }

    // Only lookup shipmentLocation if ID exists
    let shipmentLocation = null;
    if (shipmentLocationId) {
      const [location] = await strapi
        .documents("api::shipment-location.shipment-location")
        .findMany({
          filters: { id: shipmentLocationId },
          limit: 1,
        });

      if (!location && data.shipment_status !== "Delivered") {
        strapi.log.warn(
          "⚠️ Shipment location not found, but not required for this status."
        );
      }

      shipmentLocation = location;
    }

    const updateData: Record<string, any> = {};

    // ✅ 1. Update shipment_status
    if (data.shipment_status) {
      updateData.current_status = data.shipment_status;
    }

    // ✅ 2. Set current_location
    if (data.shipment_status === "Delivered") {
      updateData.current_location = { set: [] };
    } else if (shipmentLocation && shipmentLocation.documentId) {
      updateData.current_location = {
        set: [shipmentLocation.documentId],
      };
    }

    // ✅ 3. Set delivered_at timestamp if delivered
    if (data.shipment_status === "Delivered") {
      updateData.delivered_at = data.updatedAt || new Date();
    }

    // ✅ 4. Apply shipment update
    await strapi.documents("api::shipment.shipment").update({
      documentId: shipment.documentId,
      data: updateData,
      status: "published",
    });

    strapi.log.info(
      `✅ Shipment ${shipment.tracking_code} updated via ShipmentEvent: ${data.shipment_status}`
    );
  },
};
