import { type Event } from "@strapi/database/dist/lifecycles";

export default {
  async beforeCreate(event: Event) {
    const { data } = event.params;

    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    const isPickup = data.hasOwnProperty("is_pickup") ? data.is_pickup : false;
    const getId = (rel: any) => rel?.connect?.[0]?.id;

    // Delivery / Pickup Validation
    if (isPickup) {
      const pickupCenterId = getId(data.pickup_center);
      if (!pickupCenterId) {
        strapi.log.error("Pickup center is required for pickup shipments.");
        throw new Error("Pickup center is required for pickup shipments.");
      }

      const pickupCenter = await strapi
        .documents("api::shipment-location.shipment-location")
        .findFirst({ filters: { id: pickupCenterId } });

      if (!pickupCenter) {
        strapi.log.error("Pickup center not found.");
        throw new Error("Pickup center not found.");
      }
      if (pickupCenter.type !== "delivery") {
        strapi.log.error("Pickup center must be of type 'delivery'.");
        throw new Error("Pickup center must be of type 'delivery'.");
      }

      // Clear delivery address fields
      data.receiver_address = null;
      data.receiver_city = null;
      data.receiver_country = null;
    } else {
      if (
        !data.receiver_address ||
        !data.receiver_city ||
        !data.receiver_country
      ) {
        strapi.log.error(
          "Receiver address, city, and country are required for delivery shipments."
        );
        throw new Error(
          "Receiver address, city, and country are required for delivery shipments."
        );
      }

      // Clear pickup center
      data.pickup_center = null;
    }

    // Generate Guaranteed-Unique Tracking Code
    let unique = false;
    let trackingCode = "";

    while (!unique) {
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      const stamp = Date.now().toString().slice(-4);
      trackingCode = `TRK-${stamp}-${rand}`;

      const existing = await strapi.entityService.findMany(
        "api::shipment.shipment",
        {
          filters: { tracking_code: trackingCode },
          limit: 1,
        }
      );

      if (existing.length === 0) unique = true;
    }

    data.tracking_code = trackingCode;

    // Set initial current location to null
    data.current_location = null;
  },
};
