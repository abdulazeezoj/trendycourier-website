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
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "from",
            in: "query",
            description: "Code of the origin location.",
            deprecated: false,
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "to",
            in: "query",
            description: "Code of the destination location.",
            deprecated: false,
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "size",
            in: "query",
            description: "Code of the freight measuring size.",
            deprecated: false,
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "value",
            in: "query",
            description: "Value of the freight size with respect to the size.",
            deprecated: false,
            required: false,
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
                        size: {
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
                        "size",
                        "base_currency",
                        "destination_currency",
                        "exchange_rate",
                        "shipping_fee",
                        "clearing_fee",
                        "estimated_days",
                      ],
                    },
                    value: { type: "string" },
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
                    "value",
                    "fee",
                    "fee_converted",
                  ],
                },
                example: {
                  origin: {
                    code: "hong-kong-cn",
                    city: "Hong Kong",
                    country: "China",
                  },
                  destination: {
                    code: "logos-ng",
                    city: "Lagos",
                    country: "Nigeria",
                  },
                  freight: {
                    method: {
                      code: "air",
                      name: "Air",
                    },
                    size: {
                      code: "weight",
                      name: "Weight",
                      unit: "kg",
                      description: "",
                    },
                    base_currency: "USD",
                    destination_currency: "NGN",
                    exchange_rate: 1500,
                    shipping_fee: 3,
                    clearing_fee: 0.5,
                    estimated_days: 7,
                  },
                  value: "10",
                  fee: {
                    shipping_fee: 30,
                    clearing_fee: 5,
                    total_fee: 35,
                  },
                  fee_converted: {
                    shipping_fee: 45000,
                    clearing_fee: 7500,
                    total_fee: 52500,
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
        tags: ["Freight-rate"],
      },
    },
  },
};

export { freightRateDocs };
export default customRoutes;
