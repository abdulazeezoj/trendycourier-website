/**
 * freight-rate controller
 */

import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import { Context } from "koa";
import {
  FreightEstimateParams,
  FreightEstimateResult,
} from "../services/freight-rate";

export default factories.createCoreController(
  "api::freight-rate.freight-rate",
  ({ strapi }) => ({
    async estimate(ctx: Context) {
      const { from, to, method, size, value } = ctx.query;

      try {
        const result: FreightEstimateResult = await strapi
          .service("api::freight-rate.freight-rate")
          .estimate({ from, to, method, size, value } as FreightEstimateParams);

        ctx.body = result;
        ctx.status = 200;
      } catch (err: any) {
        if (err instanceof errors.ValidationError) {
          return ctx.badRequest(err.message);
        } else if (err instanceof errors.NotFoundError) {
          return ctx.notFound(err.message);
        } else {
          return ctx.internalServerError(
            "An error occurred while estimating freight rate"
          );
        }
      }
    },
  })
);
