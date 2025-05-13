/**
 * freight-rate controller
 */

import { factories } from "@strapi/strapi";
import { Context } from "koa";

export default factories.createCoreController(
  "api::freight-rate.freight-rate",
  ({ strapi }) => ({
    async estimate(ctx: Context) {
      const { from, to, method, size, value } = ctx.query as {
        from: string;
        to: string;
        method: string;
        size: string;
        value: string | number;
      };

      if (!from || !to || !method || !size) {
        return ctx.badRequest("Missing required parameters");
      }

      // Only require value if per_unit is true
      // We'll fetch the freight rate first to check per_unit

      // 1. Fetch origin
      const [originRaw] = await strapi.entityService.findMany(
        "api::shipping-origin.shipping-origin",
        { filters: { code: from }, limit: 1 }
      );
      if (!originRaw) return ctx.notFound("Origin not found");

      const origin = originRaw as typeof originRaw & {
        city: string;
        country: string;
        code: string;
      };

      // 2. Fetch destination with currency
      const [destinationRaw] = await strapi.entityService.findMany(
        "api::shipping-destination.shipping-destination",
        {
          filters: { code: to },
          populate: ["currency"],
          limit: 1,
        }
      );
      if (!destinationRaw) return ctx.notFound("Destination not found");

      const destination = destinationRaw as typeof destinationRaw & {
        city: string;
        country: string;
        code: string;
        currency: { code: string; name: string };
      };
      if (!destination.currency)
        return ctx.notFound("Destination currency not found");

      // 3. Fetch method
      const [shipMethod] = await strapi.entityService.findMany(
        "api::shipping-method.shipping-method",
        { filters: { code: method }, limit: 1 }
      );
      if (!shipMethod) return ctx.notFound("Shipping method not found");

      // 4. Fetch size
      const [shipSize] = await strapi.entityService.findMany(
        "api::shipping-size.shipping-size",
        { filters: { code: size }, limit: 1 }
      );
      if (!shipSize) return ctx.notFound("Shipping size not found");

      // 5. Fetch freight rate
      const [freightRateRaw] = await strapi.entityService.findMany(
        "api::freight-rate.freight-rate",
        {
          filters: {
            shipping_origin: { id: origin.id },
            shipping_destination: { id: destination.id },
            shipping_method: { id: shipMethod.id },
            shipping_size: { id: shipSize.id },
            active: true,
          },
          populate: ["currency"],
          sort: "createdAt:desc",
          limit: 1,
        }
      );
      if (!freightRateRaw) return ctx.notFound("Freight rate not found");

      const freightRate = freightRateRaw as typeof freightRateRaw & {
        currency: { code: string; name: string };
      };
      if (!freightRate.currency)
        return ctx.notFound("Freight rate currency not found");

      // 6. Calculate total
      let total = 0;
      let conversionRate = 1;

      const shippingFee = freightRate.shipping_fee || 0;
      const clearingFee = freightRate.clearing_fee || 0;

      let totalShippingFee = 0;
      let totalClearingFee = 0;

      if (freightRate.per_unit) {
        if (value === undefined || value === null || value === "") {
          return ctx.badRequest("Missing required value for per-unit mode");
        }
        const parsed = Number(value);
        if (isNaN(parsed) || parsed <= 0) {
          return ctx.badRequest(
            "Invalid or missing numeric value for per-unit mode"
          );
        }

        totalShippingFee = shippingFee * parsed;
        totalClearingFee = clearingFee * parsed;
        total = totalShippingFee + totalClearingFee;
      } else {
        totalShippingFee = shippingFee;
        totalClearingFee = clearingFee;
        total = shippingFee + clearingFee;
      }

      // 7. Currency conversion
      const sourceCurrency = freightRate.currency.code;
      const destinationCurrency = destination.currency.code;
      let convertedTotal = total;
      let convertedShippingFee = totalShippingFee;
      let convertedClearingFee = totalClearingFee;

      if (sourceCurrency !== destinationCurrency) {
        let [exchangeRate] = await strapi.entityService.findMany(
          "api::exchange-rate.exchange-rate",
          {
            filters: {
              from_currency: { code: sourceCurrency },
              to_currency: { code: destinationCurrency },
            },
            limit: 1,
          }
        );

        // Try inverted if not found
        if (!exchangeRate || !exchangeRate.rate) {
          [exchangeRate] = await strapi.entityService.findMany(
            "api::exchange-rate.exchange-rate",
            {
              filters: {
                from_currency: { code: destinationCurrency },
                to_currency: { code: sourceCurrency },
              },
              limit: 1,
            }
          );

          if (!exchangeRate || !exchangeRate.rate) {
            return ctx.badRequest(
              `Exchange rate not found for ${sourceCurrency} → ${destinationCurrency} or its inverse`
            );
          }

          // Invert the rate
          conversionRate = 1 / exchangeRate.rate;
        } else {
          conversionRate = exchangeRate.rate;
        }

        convertedShippingFee = totalShippingFee * conversionRate;
        convertedClearingFee = totalClearingFee * conversionRate;
        convertedTotal = convertedShippingFee + convertedClearingFee;
      }

      // 8. Final response
      ctx.body = {
        origin: {
          code: origin.code,
          city: origin.city,
          country: origin.country,
        },
        destination: {
          code: destination.code,
          city: destination.city,
          country: destination.country,
        },
        method,
        size,
        value,
        base_currency: sourceCurrency,
        destination_currency: destinationCurrency,
        exchange_rate: conversionRate,
        shipping_fee: shippingFee,
        clearing_fee: clearingFee,
        total_shipping_fee: totalShippingFee,
        total_clearing_fee: totalClearingFee,
        total_fee: total,
        converted_shipping_fee: convertedShippingFee,
        converted_clearing_fee: convertedClearingFee,
        total_converted_fee: convertedTotal,
        estimated_days: freightRate.estimated_days || null,
      };
    },
  })
);
