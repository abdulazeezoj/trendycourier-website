/**
 * shipment-event service
 */

import { factories } from "@strapi/strapi";

const smsTemplate = `Hello {{name}},
Shipment Status: {{status}}
Shipment Location: {{location}}
Shipment Message: {{message}}
Delivery Type: {{deliveryType}}
Delivery Address: {{deliveryAddress}}

Tracking Code: {{trackingCode}}`;

const emailTemplate = `
<p>Hello {{name}},</p>
<p>
Your shipment status has been updated:
<ul>
<li><strong>Status:</strong> {{status}}</li>
<li><strong>Location:</strong> {{location}}</li>
<li><strong>Message:</strong> {{message}}</li>
<li><strong>Delivery Type:</strong> {{deliveryType}}</li>
<li><strong>Delivery Address:</strong> {{deliveryAddress}}</li>
</ul>
</p>

<p>Tracking Code: <strong>{{trackingCode}}</strong></p>`;

export type NotifyShipmentStatusParams = {
  shipment: {
    id: number;
    receiver_name: string;
    receiver_phone: string;
    receiver_email: string;
    receiver_address: string;
    is_pickup: boolean;
    tracking_code: string;
    pickup_center?: {
      name?: string;
      city?: string;
      country?: string;
    };
  };
  shipment_event: {
    progress: string;
    message: string;
    location?: {
      name?: string;
      city?: string;
      country?: string;
    };
  };
};

const notifyShipmentStatus = async (
  strapi: any,
  params: NotifyShipmentStatusParams
) => {
  const { shipment, shipment_event } = params;
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

  // Get current shipment location (if available)
  let currentLocationString = "";
  if (shipment_event.location) {
    const shipmentLocation = shipment_event.location;
    currentLocationString = [
      shipmentLocation.name,
      shipmentLocation.city,
      shipmentLocation.country,
    ]
      .filter(Boolean)
      .join(", ");
  }

  // Prepare templates
  let smsData: Record<string, any>;
  let emailData: Record<string, any>;

  const deliveryType = isPickup ? "Pickup" : "Delivery";
  const deliveryAddress = isPickup
    ? [pickupCenterName, pickupCenterCity, pickupCenterCountry]
        .filter(Boolean)
        .join(", ")
    : receiverAddress;

  smsData = {
    name: receiverName,
    status: shipment_event.progress,
    location: currentLocationString,
    message: shipment_event.message,
    deliveryType,
    deliveryAddress,
    trackingCode,
  };

  emailData = smsData;

  const notificationService = strapi.service("api::notification.notification");
  // Send SMS
  if (receiverPhone) {
    try {
      await notificationService.sendSMS(receiverPhone, {
        template: smsTemplate,
        data: smsData,
      });
    } catch (err) {
      strapi.log.error("Failed to send shipment event SMS notification:", err);
    }
  }

  // Send Email
  if (receiverEmail) {
    try {
      const emailSubject = `Shipment Update: ${shipment_event.progress}`;
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
};

export default factories.createCoreService(
  "api::shipment-event.shipment-event",
  ({ strapi }) => ({
    notifyShipmentStatus: (params: NotifyShipmentStatusParams) =>
      notifyShipmentStatus(strapi, params),
  })
);
