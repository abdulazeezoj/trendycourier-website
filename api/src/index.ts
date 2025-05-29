import type { Core } from "@strapi/strapi";
import { exchangeRateDocs } from "./api/exchange-rate/routes/01-custom";
import { freightRateDocs } from "./api/freight-rate/routes/01-custom";
import { shipmentEventDocs } from "./api/shipment-event/routes/01-custom";
import { shipmentDocs } from "./api/shipment/routes/01-custom";

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    if (strapi.plugin("documentation")) {
      // Register custom routes for documentation
      strapi
        .plugin("documentation")
        .service("override")
        .registerOverride({
          paths: {
            ...freightRateDocs.paths,
            ...exchangeRateDocs.paths,
            ...shipmentDocs.paths,
            ...shipmentEventDocs.paths,
          },
        });
    }
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
