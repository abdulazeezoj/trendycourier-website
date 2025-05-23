/**
 * freight-rate service
 */

import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import { ExchangeRateConvertResult } from "../../exchange-rate/services/exchange-rate";

export type FreightEstimateParams = {
  from: string;
  to: string;
  method: string;
  size: string;
  value?: string | number;
};

export type FreightEstimateResult = {
  origin: {
    code: string;
    city: string;
    country: string;
  };
  destination: {
    code: string;
    city: string;
    country: string;
  };
  freight: {
    method: {
      code: string;
      name: string;
    };
    size: {
      code: string;
      name: string;
      unit: string;
      description: string | null;
    };
    base_currency: string;
    destination_currency: string;
    exchange_rate: number;
    shipping_fee: number;
    clearing_fee: number;
    estimated_days: number | null;
  };
  value?: string | number;
  fee: {
    shipping_fee: number;
    clearing_fee: number;
    total_fee: number;
  };
  fee_converted: {
    shipping_fee: number;
    clearing_fee: number;
    total_fee: number;
  };
};

const estimate = async (
  strapi: any,
  params: FreightEstimateParams
): Promise<FreightEstimateResult> => {
  const { from, to, method, size, value } = params;

  if (!from || !to || !method || !size) {
    throw new errors.ValidationError("Missing required parameters");
  }

  // 1. Fetch origin
  const [origin] = await strapi
    .documents("api::shipping-origin.shipping-origin")
    .findMany({ filters: { code: from }, limit: 1 });
  if (!origin) throw new errors.NotFoundError("Origin not found");

  // 2. Fetch destination with currency
  const [destination] = await strapi
    .documents("api::shipping-destination.shipping-destination")
    .findMany({
      filters: { code: to },
      populate: ["currency"],
      limit: 1,
    });
  if (!destination) throw new errors.NotFoundError("Destination not found");
  if (!destination.currency)
    throw new errors.NotFoundError("Destination currency not found");

  // 3. Fetch method
  const [shipMethod] = await strapi
    .documents("api::shipping-method.shipping-method")
    .findMany({ filters: { code: method }, limit: 1 });
  if (!shipMethod) throw new errors.NotFoundError("Shipping method not found");

  // 4. Fetch size
  const [shipSize] = await strapi
    .documents("api::shipping-size.shipping-size")
    .findMany({ filters: { code: size }, limit: 1 });
  if (!shipSize) throw new errors.NotFoundError("Shipping size not found");

  // 5. Fetch freight rate
  const [freightRate] = await strapi
    .documents("api::freight-rate.freight-rate")
    .findMany({
      filters: {
        shipping_origin: { id: origin.id },
        shipping_destination: { id: destination.id },
        shipping_method: { id: shipMethod.id },
        shipping_size: { id: shipSize.id },
        active: true,
      },
      populate: {
        shipping_method: true,
        shipping_size: true,
        shipping_origin: true,
        shipping_destination: true,
        currency: true,
      },
      sort: "createdAt:desc",
      limit: 1,
    });
  if (!freightRate) throw new errors.NotFoundError("Freight rate not found");
  if (!freightRate.currency)
    throw new errors.NotFoundError("Freight rate currency not found");

  // 6. Calculate total
  let total = 0;
  let conversionRate = 1;
  const shippingFee = freightRate.shipping_fee || 0;
  const clearingFee = freightRate.clearing_fee || 0;
  let totalShippingFee = 0;
  let totalClearingFee = 0;

  if (freightRate.per_unit) {
    if (value === undefined || value === null || value === "") {
      throw new errors.ValidationError(
        "Missing required value for per-unit mode"
      );
    }
    const parsed = Number(value);
    if (isNaN(parsed) || parsed <= 0) {
      throw new errors.ValidationError(
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
    const convertedTotalResult: ExchangeRateConvertResult = await strapi
      .service("api::exchange-rate.exchange-rate")
      .convert(sourceCurrency, destinationCurrency, total);
    conversionRate = convertedTotalResult.rate;
    convertedShippingFee = totalShippingFee * convertedTotalResult.rate;
    convertedClearingFee = totalClearingFee * convertedTotalResult.rate;
    convertedTotal = convertedTotalResult.convertedAmount;
  }

  // 8. Final response
  return {
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
    freight: {
      method: {
        code: shipMethod.code,
        name: shipMethod.name,
      },
      size: {
        code: shipSize.code,
        name: shipSize.name,
        unit: shipSize.unit,
        description: shipSize?.description || null,
      },
      base_currency: sourceCurrency,
      destination_currency: destinationCurrency,
      exchange_rate: conversionRate,
      shipping_fee: shippingFee,
      clearing_fee: clearingFee,
      estimated_days: freightRate?.estimated_days || null,
    },
    value,
    fee: {
      shipping_fee: totalShippingFee,
      clearing_fee: totalClearingFee,
      total_fee: total,
    },
    fee_converted: {
      shipping_fee: convertedShippingFee,
      clearing_fee: convertedClearingFee,
      total_fee: convertedTotal,
    },
  };
};

export default factories.createCoreService(
  "api::freight-rate.freight-rate",
  ({ strapi }) => ({
    estimate: (params: FreightEstimateParams) => estimate(strapi, params),
  })
);
