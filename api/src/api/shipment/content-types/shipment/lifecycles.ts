import { type Event } from "@strapi/database/dist/lifecycles";
import { errors } from "@strapi/utils";
import { getSetRelationId } from "../../../../utils/helpers";

export default {
  async beforeCreate(event: Event) {
    const { data } = event.params;

    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    const isPickup = data.hasOwnProperty("is_pickup") ? data.is_pickup : false;

    // Delivery / Pickup Validation
    if (isPickup) {
      const [pickupCenterId] = getSetRelationId(data.pickup_center);

      if (!pickupCenterId) {
        strapi.log.error("Pickup center is required for pickup shipments.");
        throw new errors.ValidationError(
          "Pickup center is required for pickup shipments."
        );
      }

      const pickupCenter = await strapi
        .documents("api::shipment-location.shipment-location")
        .findFirst({ filters: { id: pickupCenterId } });

      if (!pickupCenter) {
        strapi.log.error("Pickup center not found.");
        throw new errors.NotFoundError("Pickup center not found.");
      }
      if (pickupCenter.type.toLowerCase() !== "delivery") {
        strapi.log.error("Pickup center must be of type 'delivery'.");
        throw new errors.ValidationError(
          "Pickup center must be of type 'delivery'."
        );
      }
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

      const [existing] = await strapi
        .documents("api::shipment.shipment")
        .findMany({
          filters: { tracking_code: trackingCode },
          limit: 1,
        });

      if (!existing) unique = true;
    }

    data.tracking_code = trackingCode;
  },
  async afterCreate(event: Event) {
    const { data } = event.params;

    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    const [pickupCenterId] = getSetRelationId(data.pickup_center);

    const receiverPhone = data.receiver_phone;
    const receiverName = data.receiver_name;
    const receiverEmail = data.receiver_email;
    const receiverAddress = data.receiver_address;
    const trackingCode = data.tracking_code;
    const isPickup = data.is_pickup;
    const notificationService = strapi.service(
      "api::notification.notification"
    );

    let smsTemplate: string;
    let smsData: Record<string, any>;
    let emailTemplate: string;
    let emailData: Record<string, any>;

    if (isPickup) {
      // Fetch pickup center details
      let pickupCenterName = "";
      let pickupCenterCity = "";
      let pickupCenterCountry = "";
      if (pickupCenterId) {
        const pickupCenter = await strapi
          .documents("api::shipment-location.shipment-location")
          .findFirst({ filters: { id: pickupCenterId } });

        if (pickupCenter) {
          pickupCenterName = pickupCenter.name || "";
          pickupCenterCity = pickupCenter.city || "";
          pickupCenterCountry = pickupCenter.country || "";
        }
      }
      smsTemplate = `Hello {{name}}, your package is on the way! Tracking code: {{trackingCode}}. Pickup center: {{pickupCenterName}}, {{pickupCenterCity}}, {{pickupCenterCountry}}.`;
      smsData = {
        name: receiverName,
        trackingCode,
        pickupCenterName,
        pickupCenterCity,
        pickupCenterCountry,
      };

      emailTemplate = `<p>Hello {{name}},</p><p>Your package is on the way!</p><p><strong>Tracking code:</strong> {{trackingCode}}</p><p><strong>Pickup center:</strong> {{pickupCenterName}}, {{pickupCenterCity}}, {{pickupCenterCountry}}</p>`;
      emailData = smsData;
    } else {
      smsTemplate = `Hello {{name}}, your package is on the way! Tracking code: {{trackingCode}}. Address: {{address}}.`;
      smsData = {
        name: receiverName,
        address: receiverAddress,
        trackingCode,
      };
      emailTemplate = `<p>Hello {{name}},</p><p>Your package is on the way!</p><p><strong>Tracking code:</strong> {{trackingCode}}</p><p><strong>Address:</strong> {{address}}</p>`;
      emailData = smsData;
    }

    // Send SMS
    try {
      await notificationService.sendSMS(receiverPhone, {
        template: smsTemplate,
        data: smsData,
      });
    } catch (err) {
      strapi.log.error("Failed to send SMS notification:", err);
    }

    // Send Email
    const emailSubject = "Your Shipment is on the Way!";
    try {
      await notificationService.sendEmail(
        receiverEmail,
        receiverName,
        emailSubject,
        {
          template: emailTemplate,
          data: emailData,
          isHtml: true,
        }
      );
    } catch (err) {
      strapi.log.error("Failed to send email notification:", err);
    }
  },
};
