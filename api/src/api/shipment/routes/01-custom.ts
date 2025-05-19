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
              "application/json": {},
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
