const customRoutes = {
  routes: [
    {
      method: "GET",
      path: "/exchange-rates/convert",
      handler: "api::exchange-rate.exchange-rate.convert",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};

const exchangeRateDocs = {
  paths: {
    "/exchange-rates/convert": {
      get: {
        operationId: "get/exchange-rates/convert",
        summary: "Convert exchange rates",
        description: "",
        parameters: [
          {
            name: "from",
            in: "query",
            description: "Currency code to convert from.",
            deprecated: false,
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "to",
            in: "query",
            description: "Currency code to convert to.",
            deprecated: false,
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "amount",
            in: "query",
            description: "Amount to convert.",
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
                    from: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        code: { type: "string" },
                      },
                      required: ["name", "code"],
                    },
                    to: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        code: { type: "string" },
                      },
                      required: ["name", "code"],
                    },
                    rate: { type: "number" },
                    amount: { type: "number" },
                    converted: {
                      type: "object",
                      properties: {
                        round: { type: "number" },
                        full: { type: "number" },
                      },
                      required: ["round", "full"],
                    },
                    inverted: { type: "boolean" },
                  },
                  required: [
                    "from",
                    "to",
                    "rate",
                    "amount",
                    "converted",
                    "inverted",
                  ],
                },
                example: {
                  from: {
                    name: "Nigerian Naira",
                    code: "NGN",
                  },
                  to: {
                    name: "US Dollar",
                    code: "USD",
                  },
                  rate: 0.123,
                  amount: 100,
                  converted: {
                    round: 12.3,
                    full: 12.315,
                  },
                  inverted: false,
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
        tags: ["Exchange-rate"],
      },
    },
  },
};

export { exchangeRateDocs };
export default customRoutes;
