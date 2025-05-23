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
        populate: {
          pickup_center: true,
        },
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

    // --- Notification logic ---
    // Fetch receiver details
    const receiverName = shipment.receiver_name;
    const receiverPhone = shipment.receiver_phone;
    const receiverEmail = shipment.receiver_email;
    const receiverAddress = shipment.receiver_address;
    const isPickup = shipment.is_pickup;
    const trackingCode = shipment.tracking_code;
    let pickupCenterName = "";
    let pickupCenterCity = "";
    let pickupCenterCountry = "";
    if (isPickup && shipment.pickup_center) {
      pickupCenterName = shipment.pickup_center.name || "";
      pickupCenterCity = shipment.pickup_center.city || "";
      pickupCenterCountry = shipment.pickup_center.country || "";
    }

    // Prepare templates
    let smsTemplate;
    let smsData;
    let emailTemplate;
    let emailData;
    if (isPickup) {
      smsTemplate = `Hello {{name}}, your shipment status is now '{{status}}'. Tracking code: {{trackingCode}}. Pickup center: {{pickupCenterName}}, {{pickupCenterCity}}, {{pickupCenterCountry}}.`;
      smsData = {
        name: receiverName,
        status: data.shipment_status,
        trackingCode,
        pickupCenterName,
        pickupCenterCity,
        pickupCenterCountry,
      };
      emailTemplate = `<p>Hello {{name}},</p><p>Your shipment status is now '<strong>{{status}}</strong>'.</p><p><strong>Tracking code:</strong> {{trackingCode}}</p><p><strong>Pickup center:</strong> {{pickupCenterName}}, {{pickupCenterCity}}, {{pickupCenterCountry}}</p>`;
      emailData = smsData;
    } else {
      smsTemplate = `Hello {{name}}, your shipment status is now '{{status}}'. Tracking code: {{trackingCode}}. Address: {{address}}.`;
      smsData = {
        name: receiverName,
        status: data.shipment_status,
        trackingCode,
        address: receiverAddress,
      };
      emailTemplate = `<p>Hello {{name}},</p><p>Your shipment status is now '<strong>{{status}}</strong>'.</p><p><strong>Tracking code:</strong> {{trackingCode}}</p><p><strong>Address:</strong> {{address}}</p>`;
      emailData = smsData;
    }

    const notificationService = strapi.service(
      "api::notification.notification"
    );
    // Send SMS
    if (receiverPhone) {
      try {
        await notificationService.sendSMS(receiverPhone, {
          template: smsTemplate,
          data: smsData,
        });
      } catch (err) {
        strapi.log.error(
          "Failed to send shipment event SMS notification:",
          err
        );
      }
    }

    // Send Email
    if (receiverEmail) {
      try {
        const emailSubject = `Shipment Update: ${data.shipment_status}`;
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
        strapi.log.error(
          "Failed to send shipment event email notification:",
          err
        );
      }
    }
  },
};
