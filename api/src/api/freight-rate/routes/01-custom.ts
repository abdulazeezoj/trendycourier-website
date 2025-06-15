const customRoutes = {
  routes: [
    {
      method: "GET",
      path: "/freight-rates/estimate",
      handler: "api::freight-rate.freight-rate.estimate",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};

const freightRateDocs = {
  paths: {
    "/freight-rates/estimate": {
      get: {
        operationId: "get/freight-rates/estimate",
        summary: "Estimate freight rates",
        description: "",
        parameters: [
          {
            name: "method",
            in: "query",
            description: "Code of the shipping method.",
            deprecated: false,
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "from",
            in: "query",
            description: "Code of the origin location.",
            deprecated: false,
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "to",
            in: "query",
            description: "Code of the destination location.",
            deprecated: false,
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "metric",
            in: "query",
            description: "Code of the freight measuring metric.",
            deprecated: false,
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "size",
            in: "query",
            description: "Freight size with respect to the metric.",
            deprecated: false,
            required: true,
            schema: {
              type: "number",
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
                    origin: {
                      type: "object",
                      properties: {
                        code: { type: "string" },
                        city: { type: "string" },
                        country: { type: "string" },
                      },
                      required: ["code", "city", "country"],
                    },
                    destination: {
                      type: "object",
                      properties: {
                        code: { type: "string" },
                        city: { type: "string" },
                        country: { type: "string" },
                      },
                      required: ["code", "city", "country"],
                    },
                    freight: {
                      type: "object",
                      properties: {
                        method: {
                          type: "object",
                          properties: {
                            code: { type: "string" },
                            name: { type: "string" },
                          },
                          required: ["code", "name"],
                        },
                        metric: {
                          type: "object",
                          properties: {
                            code: { type: "string" },
                            name: { type: "string" },
                            unit: { type: "string" },
                            description: { type: "string" },
                          },
                          required: ["code", "name", "unit"],
                        },
                        base_currency: { type: "string" },
                        destination_currency: { type: "string" },
                        exchange_rate: { type: "number" },
                        shipping_fee: { type: "number" },
                        clearing_fee: { type: "number" },
                        estimated_days: { type: "integer" },
                      },
                      required: [
                        "method",
                        "metric",
                        "base_currency",
                        "destination_currency",
                        "exchange_rate",
                        "shipping_fee",
                        "clearing_fee",
                        "estimated_days",
                      ],
                    },
                    size: { type: ["string", "number"] },
                    fee: {
                      type: "object",
                      properties: {
                        shipping_fee: { type: "number" },
                        clearing_fee: { type: "number" },
                        total_fee: { type: "number" },
                      },
                      required: ["shipping_fee", "clearing_fee", "total_fee"],
                    },
                    fee_converted: {
                      type: "object",
                      properties: {
                        shipping_fee: { type: "number" },
                        clearing_fee: { type: "number" },
                        total_fee: { type: "number" },
                      },
                      required: ["shipping_fee", "clearing_fee", "total_fee"],
                    },
                  },
                  required: [
                    "origin",
                    "destination",
                    "freight",
                    "size",
                    "fee",
                    "fee_converted",
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
        tags: ["Freight-rate"],
      },
    },
  },
};

export { freightRateDocs };
export default customRoutes;
