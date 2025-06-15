/**
 * freight-rate controller
 */

import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import { Context } from "koa";
import { EstimateParams, EstimateResult } from "../services/freight-rate";

export default factories.createCoreController(
  "api::freight-rate.freight-rate",
  ({ strapi }) => ({
    async estimate(ctx: Context) {
      const { from, to, method, metric, size } = ctx.query;

      try {
        const result: EstimateResult = await strapi
          .service("api::freight-rate.freight-rate")
          .estimate({ from, to, method, metric, size } as EstimateParams);

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
