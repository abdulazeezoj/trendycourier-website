/**
 * exchange-rate controller
 */

import { factories } from "@strapi/strapi";
import { Context } from "koa";

export default factories.createCoreController(
  "api::exchange-rate.exchange-rate",
  ({ strapi }) => ({
    async convert(ctx: Context) {
      const { from, to, amount } = ctx.query;

      if (!from || !to || !amount) {
        return ctx.badRequest(
          "Missing required query parameters: from, to, amount"
        );
      }

      const exchangeRates = await strapi.entityService.findMany(
        "api::exchange-rate.exchange-rate",
        {
          filters: {
            from_currency: { code: from },
            to_currency: { code: to },
          },
          populate: ["from_currency", "to_currency"],
          limit: 1,
        }
      );

      if (exchangeRates.length === 0) {
        return ctx.notFound("Exchange rate not found");
      }

      const rate = exchangeRates[0].rate;
      const convertedAmount = parseFloat(String(amount)) * rate;

      ctx.body = {
        from,
        to,
        rate,
        amount: parseFloat(String(amount)),
        convertedAmount,
      };
      ctx.status = 200;
    },
  })
);
