import type { Core } from "@strapi/strapi";
import { exchangeRateDocs } from "./api/exchange-rate/routes/custom-exchange-rate";
import { freightRateDocs } from "./api/freight-rate/routes/custom-freight-rate";

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi
      .plugin("documentation")
      .service("override")
      .registerOverride({
        paths: {
          ...freightRateDocs.paths,
          ...exchangeRateDocs.paths,
        },
      });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
