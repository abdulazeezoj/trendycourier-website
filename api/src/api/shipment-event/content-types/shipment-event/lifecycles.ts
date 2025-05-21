import { type Event } from "@strapi/database/dist/lifecycles";

export default {
  async afterCreate(event: Event) {
    const { data } = event.params;

    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    const getId = (rel: any) => rel?.connect?.[0]?.id;

    const shipmentLocationId = getId(data.shipment_location);
    const shipmentId = getId(data.shipment);

    if (!shipmentId) {
      strapi.log.error("Shipment relation missing in event result.");
      throw new Error("Shipment relation missing.");
    }

    const [shipment] = await strapi
      .documents("api::shipment.shipment")
      .findMany({
        filters: {
          id: shipmentId,
        },
        limit: 1,
      });
    const [shipmentLocation] = await strapi
      .documents("api::shipment-location.shipment-location")
      .findMany({
        filters: {
          id: shipmentLocationId,
        },
        limit: 1,
      });

    if (!shipmentLocation) {
      strapi.log.error("Shipment location not found for event.");
      throw new Error("Shipment location not found.");
    }

    if (!shipment) {
      strapi.log.error("Shipment not found for event.");
      throw new Error("Shipment not found.");
    }

    const updateData: Record<string, any> = {};

    // ✅ 1. Update status
    if (data.shipment_status) {
      updateData.current_status = data.shipment_status;
    }

    // ✅ 2. Update current location if provided
    if (shipmentLocationId) {
      updateData.current_location = {
        set: [shipmentLocation.documentId],
      };
    }

    // ✅ 3. Set deliveredAt timestamp if final delivery
    if (data.shipment_status === "delivered") {
      updateData.deliveredAt = data.updatedAt || new Date();
    }

    // ✅ 4. Apply the update
    await strapi.documents("api::shipment.shipment").update({
      documentId: shipment.documentId,
      data: updateData,
    });

    strapi.log.info(
      `Shipment ${shipment.tracking_code} updated via ShipmentEvent.`
    );
  },
};
