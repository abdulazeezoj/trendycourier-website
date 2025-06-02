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
  metric: string;
  size?: string | number;
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
    metric: {
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
  size?: string | number;
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
  const { from, to, method, metric, size } = params;

  if (!from || !to || !method || !metric) {
    throw new errors.ValidationError("Missing required parameters");
  }

  // 1. Fetch origin
  const [shipmentOrigin] = await strapi
    .documents("api::shipment-origin.shipment-origin")
    .findMany({ filters: { code: from }, limit: 1 });
  if (!shipmentOrigin) throw new errors.NotFoundError("Origin not found");

  // 2. Fetch destination with currency
  const [shipmeDestination] = await strapi
    .documents("api::shipment-destination.shipment-destination")
    .findMany({
      filters: { code: to },
      populate: ["currency"],
      limit: 1,
    });
  if (!shipmeDestination) throw new errors.NotFoundError("Destination not found");
  if (!shipmeDestination.currency)
    throw new errors.NotFoundError("Destination currency not found");

  // 3. Fetch method
  const [shipmentMethod] = await strapi
    .documents("api::shipment-method.shipment-method")
    .findMany({ filters: { code: method }, limit: 1 });
  if (!shipmentMethod) throw new errors.NotFoundError("Shipping method not found");

  // 4. Fetch size
  const [shipmentMetric] = await strapi
    .documents("api::shipment-metric.shipment-metric")
    .findMany({ filters: { code: metric }, limit: 1 });
  if (!shipmentMetric) throw new errors.NotFoundError("Shipping size not found");

  // 5. Fetch freight rate
  const [freightRate] = await strapi
    .documents("api::freight-rate.freight-rate")
    .findMany({
      filters: {
        shipment_origin: { id: shipmentOrigin.id },
        shipment_destination: { id: shipmeDestination.id },
        shipment_method: { id: shipmentMethod.id },
        shipment_metric: { id: shipmentMetric.id },
      },
      populate: {
        shipment_method: true,
        shipment_metric: true,
        shipment_origin: true,
        shipment_destination: true,
        currency: true,
      },
      sort: "createdAt:desc",
      limit: 1,
      status: "published",
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
    if (size === undefined || size === null || size === "") {
      throw new errors.ValidationError(
        "Missing required value for per-unit mode"
      );
    }
    const parsed = Number(size);
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
  const destinationCurrency = shipmeDestination.currency.code;
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
      code: shipmentOrigin.code,
      city: shipmentOrigin.city,
      country: shipmentOrigin.country,
    },
    destination: {
      code: shipmeDestination.code,
      city: shipmeDestination.city,
      country: shipmeDestination.country,
    },
    freight: {
      method: {
        code: shipmentMethod.code,
        name: shipmentMethod.name,
      },
      metric: {
        code: shipmentMetric.code,
        name: shipmentMetric.name,
        unit: shipmentMetric.unit,
        description: shipmentMetric?.description || null,
      },
      base_currency: sourceCurrency,
      destination_currency: destinationCurrency,
      exchange_rate: conversionRate,
      shipping_fee: shippingFee,
      clearing_fee: clearingFee,
      estimated_days: freightRate?.estimated_days || null,
    },
    size,
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
