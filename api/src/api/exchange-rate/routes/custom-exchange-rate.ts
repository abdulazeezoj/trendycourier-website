export default {
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
