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
              "application/json": {},
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
