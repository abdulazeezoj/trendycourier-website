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
              "application/json": {},
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
