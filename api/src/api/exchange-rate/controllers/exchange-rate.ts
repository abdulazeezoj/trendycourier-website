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

      let rate: number | undefined;
      let inverted = false;
      if (exchangeRates.length > 0) {
        rate = exchangeRates[0].rate;
      } else {
        // Try inverted
        const invertedRates = await strapi.entityService.findMany(
          "api::exchange-rate.exchange-rate",
          {
            filters: {
              from_currency: { code: to },
              to_currency: { code: from },
            },
            populate: ["from_currency", "to_currency"],
            limit: 1,
          }
        );
        if (invertedRates.length > 0) {
          rate = 1 / invertedRates[0].rate;
          inverted = true;
        } else {
          return ctx.notFound("Exchange rate not found (direct or inverse)");
        }
      }

      const parsedAmount = parseFloat(String(amount));
      const convertedAmount = parsedAmount * (rate as number);

      ctx.body = {
        from,
        to,
        rate,
        amount: parsedAmount,
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        fullConvertedAmount: convertedAmount,
        inverted,
      };
      ctx.status = 200;
    },
  })
);
