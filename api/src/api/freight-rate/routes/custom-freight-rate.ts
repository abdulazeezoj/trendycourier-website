export default {
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
