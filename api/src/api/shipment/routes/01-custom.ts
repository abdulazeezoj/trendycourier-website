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
    {
      method: "POST",
      path: "/shipments/bulk",
      handler: "api::shipment.shipment.createBulk",
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
                    receiver: {
                      type: "object",
                      properties: {
                        address: { type: "string" },
                        city: { type: "string" },
                        country: { type: "string" },
                        name: { type: "string" },
                        phone: { type: "string" },
                        email: { type: "string" },
                      },
                      required: [
                        "address",
                        "city",
                        "country",
                        "name",
                        "phone",
                        "email",
                      ],
                    },
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
                    current_status: { type: "string" },
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
                    "receiver",
                    "is_pickup",
                    "pickup_center",
                    "current_status",
                    "current_location",
                    "events",
                  ],
                },
                example: {
                  tracking_code: "TRK-1234-AB1T",
                  shipping_origin: {
                    city: "Lagos",
                    country: "Nigeria",
                  },
                  shipping_destination: {
                    city: "London",
                    country: "United Kingdom",
                  },
                  receiver: {
                    address: "123 Oxford Street",
                    city: "London",
                    country: "United Kingdom",
                    name: "John Doe",
                    phone: "+44 1234 567890",
                    email: "john.doe@example.com",
                  },
                  is_pickup: false,
                  pickup_center: {
                    name: "Main Depot",
                    city: "London",
                    country: "United Kingdom",
                    type: "delivery",
                  },
                  current_status: "in-transit",
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
    "/shipments/bulk": {
      post: {
        operationId: "post/shipments/bulk",
        summary: "Create bulk shipments",
        description: "",
        requestBody: {
          description: "Upload file",
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                required: ["file"],
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "Excel file containing shipment data",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        count: {
                          type: "integer",
                        },
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "number" },
                              documentId: { type: "string" },
                              tracking_code: { type: "string" },
                              receiver_name: { type: "string" },
                              receiver_phone: { type: "string" },
                              receiver_email: { type: "string" },
                              createdAt: {
                                type: "string",
                                format: "date-time",
                              },
                              updatedAt: {
                                type: "string",
                                format: "date-time",
                              },
                              publishedAt: {
                                type: "string",
                                format: "date-time",
                              },
                              locale: { type: ["string", "null"] },
                              shipment_note: { type: ["string", "null"] },
                              receiver_city: { type: "string" },
                              receiver_country: { type: "string" },
                              receiver_address: { type: ["string", "null"] },
                              is_pickup: { type: "boolean" },
                              shipment_size: { type: "number" },
                            },
                            required: [
                              "id",
                              "documentId",
                              "tracking_code",
                              "receiver_name",
                              "receiver_phone",
                              "receiver_email",
                              "createdAt",
                              "updatedAt",
                              "publishedAt",
                              "locale",
                              "shipment_note",
                              "receiver_city",
                              "receiver_country",
                              "receiver_address",
                              "is_pickup",
                              "shipment_size",
                            ],
                          },
                        },
                      },
                      required: ["count", "items"],
                    },
                    required: ["data"],
                  },
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
