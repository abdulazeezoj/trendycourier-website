/**
 * exchange-rate service
 */

import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";

export type ExchangeRateConvertResult = {
  from: {
    code: string;
    name: string;
  };
  to: {
    code: string;
    name: string;
  };
  rate: number;
  amount: number;
  convertedAmount: number;
  inverted: boolean;
};

export default factories.createCoreService(
  "api::exchange-rate.exchange-rate",
  ({ strapi }) => ({
    async convert(
      from: string,
      to: string,
      amount: string | number
    ): Promise<ExchangeRateConvertResult> {
      if (!from || !to || !amount) {
        throw new errors.ValidationError(
          "Missing required query parameters: from, to, amount"
        );
      }

      const [exchangeRate] = await strapi
        .documents("api::exchange-rate.exchange-rate")
        .findMany({
          filters: {
            from_currency: { code: from },
            to_currency: { code: to },
          },
          populate: ["from_currency", "to_currency"],
          limit: 1,
        });

      let rate: number | undefined;
      let inverted = false;

      if (exchangeRate) {
        rate = exchangeRate.rate;
      } else {
        // Try inverted
        const [invertedRate] = await strapi
          .documents("api::exchange-rate.exchange-rate")
          .findMany({
            filters: {
              from_currency: { code: to },
              to_currency: { code: from },
            },
            populate: ["from_currency", "to_currency"],
            limit: 1,
          });

        if (invertedRate) {
          rate = 1 / invertedRate.rate;
          inverted = true;
        } else {
          throw new errors.NotFoundError(
            "Exchange rate not found (direct or inverse)"
          );
        }
      }

      const parsedAmount = parseFloat(String(amount));
      const convertedAmount = parsedAmount * (rate as number);

      return {
        from: {
          code: exchangeRate.from_currency.code,
          name: exchangeRate.from_currency.name,
        },
        to: {
          code: exchangeRate.to_currency.code,
          name: exchangeRate.to_currency.name,
        },
        rate,
        amount: parsedAmount,
        convertedAmount,
        inverted,
      };
    },
  })
);
