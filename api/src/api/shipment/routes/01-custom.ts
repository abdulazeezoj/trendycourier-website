const customRoutes = {
  routes: [
    {
      method: "GET",
      path: "/shipments/track",
      handler: "api::shipment.shipment.track",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};

const shipmentDocs = {
  paths: {
    "/shipments/track": {
      get: {
        operationId: "get/shipments/track",
        summary: "Track shipment",
        description: "",
        parameters: [
          {
            name: "code",
            in: "query",
            description: "Shipment tracking code.",
            deprecated: false,
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tracking_code: { type: "string" },
                    shipping_origin: {
                      type: "object",
                      properties: {
                        city: { type: "string" },
                        country: { type: "string" },
                      },
                      required: ["city", "country"],
                    },
                    shipping_destination: {
                      type: "object",
                      properties: {
                        city: { type: "string" },
                        country: { type: "string" },
                      },
                      required: ["city", "country"],
                    },
                    shipment_status: { type: "string" },
                    receiver_address: { type: "string" },
                    receiver_city: { type: "string" },
                    receiver_country: { type: "string" },
                    receiver_name: { type: "string" },
                    receiver_phone: { type: "string" },
                    receiver_email: { type: "string" },
                    is_pickup: { type: "boolean" },
                    pickup_center: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        city: { type: "string" },
                        country: { type: "string" },
                        type: { type: "string" },
                      },
                      required: ["name", "city", "country", "type"],
                    },
                    current_location: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        city: { type: "string" },
                        country: { type: "string" },
                        type: { type: "string" },
                      },
                      required: ["name", "city", "country", "type"],
                    },
                    events: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          shipment_status: { type: "string" },
                          shipment_location: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              city: { type: "string" },
                              country: { type: "string" },
                              type: { type: "string" },
                            },
                            required: ["name", "city", "country", "type"],
                          },
                          message: { type: "string" },
                          timestamp: { type: "string", format: "date-time" },
                        },
                        required: [
                          "shipment_status",
                          "shipment_location",
                          "message",
                          "timestamp",
                        ],
                      },
                    },
                  },
                  required: [
                    "tracking_code",
                    "shipping_origin",
                    "shipping_destination",
                    "shipment_status",
                    "receiver_address",
                    "receiver_city",
                    "receiver_country",
                    "receiver_name",
                    "receiver_phone",
                    "receiver_email",
                    "is_pickup",
                    "pickup_center",
                    "current_location",
                    "events",
                  ],
                },
                example: {
                  tracking_code: "TRK123456789",
                  shipping_origin: {
                    city: "Lagos",
                    country: "Nigeria",
                  },
                  shipping_destination: {
                    city: "London",
                    country: "United Kingdom",
                  },
                  shipment_status: "In Transit",
                  receiver_address: "123 Oxford Street",
                  receiver_city: "London",
                  receiver_country: "United Kingdom",
                  receiver_name: "John Doe",
                  receiver_phone: "+44 1234 567890",
                  receiver_email: "john.doe@example.com",
                  is_pickup: false,
                  pickup_center: {
                    name: "Main Depot",
                    city: "London",
                    country: "United Kingdom",
                    type: "delivery",
                  },
                  current_location: {
                    name: "Heathrow Airport",
                    city: "London",
                    country: "United Kingdom",
                    type: "port",
                  },
                  events: [
                    {
                      shipment_status: "in-transit",
                      shipment_location: {
                        name: "Heathrow Airport",
                        city: "London",
                        country: "United Kingdom",
                        type: "port",
                      },
                      message: "Shipment arrived at Heathrow Airport.",
                      timestamp: "2024-06-01T23:40:00Z",
                    },
                    {
                      shipment_status: "in-transit",
                      shipment_location: {
                        name: "Lagos Airport",
                        city: "Lagos",
                        country: "Nigeria",
                        type: "port",
                      },
                      message: "Shipment departed from Lagos Airport.",
                      timestamp: "2024-06-01T20:00:00Z",
                    },
                    {
                      shipment_status: "in-transit",
                      shipment_location: {
                        name: "Lagos Airport",
                        city: "Lagos",
                        country: "Nigeria",
                        type: "port",
                      },
                      message: "Shipment arrived at Lagos Airport.",
                      timestamp: "2024-06-01T15:30:00Z",
                    },
                    {
                      shipment_status: "processing",
                      shipment_location: {
                        name: "Ikeja Hub",
                        city: "Lagos",
                        country: "Nigeria",
                        type: "warehouse",
                      },
                      message: "Preparing shipment for delivery.",
                      timestamp: "2024-06-01T08:00:00Z",
                    },
                  ],
                },
              },
            },
          },
          default: {
            description: "Error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        tags: ["Shipment"],
      },
    },
  },
};

export { shipmentDocs };
export default customRoutes;
