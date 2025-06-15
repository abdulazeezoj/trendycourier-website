const customRoutes = {
  routes: [
    {
      method: "POST",
      path: "/shipment-events/bulk",
      handler: "api::shipment-event.shipment-event.createBulk",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};

const shipmentEventDocs = {
  paths: {
    "/shipment-events/bulk": {
      post: {
        operationId: "post/shipment-events/bulk",
        summary: "Create bulk shipment events",
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
                    description: "Excel file containing shipment event data",
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
                              progress: { type: "string" },
                              message: { type: ["string", "null"] },
                              shipment: {
                                type: "object",
                                properties: {
                                  id: { type: "number" },
                                  documentId: { type: "string" },
                                  tracking_code: { type: "string" },
                                },
                                required: ["id", "documentId", "tracking_code"],
                              },
                              location: {
                                type: "object",
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
                              "progress",
                              "message",
                              "shipment",
                              "location",
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
        tags: ["Shipment-event"],
      },
    },
  },
};

export { shipmentEventDocs };
export default customRoutes;
