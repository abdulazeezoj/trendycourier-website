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
                    origin: {
                      type: "object",
                      properties: {
                        city: { type: "string" },
                        country: { type: "string" },
                      },
                      required: ["city", "country"],
                    },
                    destination: {
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
                    progress: { type: "string" },
                    location: {
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
                          progress: { type: "string" },
                          location: {
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
                          "progress",
                          "location",
                          "message",
                          "timestamp",
                        ],
                      },
                    },
                  },
                  required: [
                    "tracking_code",
                    "origin",
                    "destination",
                    "receiver",
                    "is_pickup",
                    "pickup_center",
                    "progress",
                    "events",
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
                              receiver_address: { type: ["string", "null"] },
                              receiver_city: { type: "string" },
                              receiver_country: { type: "string" },
                              note: { type: ["string", "null"] },
                              is_pickup: { type: "boolean" },
                              size: { type: ["number", "null"] },
                              metric: {
                                type: "object",
                                properties: {
                                  id: { type: "number" },
                                  documentId: { type: "string" },
                                  name: { type: "string" },
                                  unit: { type: "string" },
                                  description: { type: ["string", "null"] },
                                },
                                required: [
                                  "id",
                                  "documentId",
                                  "name",
                                  "unit",
                                  "description",
                                ],
                              },
                              origin: {
                                type: "object",
                                properties: {
                                  id: { type: "number" },
                                  documentId: { type: "string" },
                                  code: { type: "string" },
                                  city: { type: "string" },
                                  country: { type: "string" },
                                },
                                required: ["id", "documentId", "code", "city", "country"],
                              },
                              destination: {
                                type: "object",
                                properties: {
                                  id: { type: "number" },
                                  documentId: { type: "string" },
                                  code: { type: "string" },
                                  city: { type: "string" },
                                  country: { type: "string" },
                                },
                                required: ["id", "documentId", "code", "city", "country"],
                              },
                              method: {
                                type: "object",
                                properties: {
                                  id: { type: "number" },
                                  code: { type: "string" },
                                  name: { type: "string" },
                                },
                                required: ["id", "code", "name"],
                              },
                              pickup_center: {
                                type: ["object", "null"],
                                properties: {
                                  id: { type: "number" },
                                  documentId: { type: "string" },
                                  name: { type: "string" },
                                  code: { type: "string" },
                                  city: { type: "string" },
                                  country: { type: "string" },
                                  type: { type: "string" },
                                },
                                required: [
                                  "id",
                                  "documentId",
                                  "name",
                                  "code",
                                  "city",
                                  "country",
                                  "type",
                                ],
                              },
                              createdAt: {
                                type: "string",
                                format: "date-time",
                              },
                              updatedAt: {
                                type: "string",
                                format: "date-time",
                              },
                            },
                            required: [
                              "id",
                              "documentId",
                              "tracking_code",
                              "receiver_name",
                              "receiver_phone",
                              "receiver_email",
                              "receiver_address",
                              "receiver_city",
                              "receiver_country",
                              "note",
                              "is_pickup",
                              "size",
                              "metric",
                              "origin",
                              "destination",
                              "method",
                              "pickup_center",
                              "createdAt",
                              "updatedAt",
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
