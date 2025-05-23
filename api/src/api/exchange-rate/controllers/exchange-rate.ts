/**
 * exchange-rate controller
 */

import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import { Context } from "koa";
import { ExchangeRateConvertResult } from "../services/exchange-rate";

export default factories.createCoreController(
  "api::exchange-rate.exchange-rate",
  ({ strapi }) => ({
    async convert(ctx: Context) {
      const { from, to, amount } = ctx.query;

      try {
        // Convert amount based on exchange rate
        const result: ExchangeRateConvertResult = await strapi
          .service("api::exchange-rate.exchange-rate")
          .convert(from, to, amount);

        ctx.body = {
          from: {
            code: result.from.code,
            name: result.from.name,
          },
          to: {
            code: result.to.code,
            name: result.to.name,
          },
          rate: result.rate,
          amount: result.amount,
          converted: {
            round: parseFloat(result.convertedAmount.toFixed(2)),
            full: result.convertedAmount,
          },
          inverted: result.inverted,
        };
        ctx.status = 200;
      } catch (err: any) {
        console.error("Error converting exchange rate:", err);

        if (err instanceof errors.ValidationError) {
          return ctx.badRequest(err.message);
        } else if (err instanceof errors.NotFoundError) {
          return ctx.notFound(err.message);
        } else {
          return ctx.internalServerError(
            "An error occurred while converting exchange rate"
          );
        }
      }
    },
  })
);
