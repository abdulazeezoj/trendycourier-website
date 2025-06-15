import { type Event } from "@strapi/database/dist/lifecycles";
import { UID } from "@strapi/types";
import { errors } from "@strapi/utils";
import {
  getConnectRelationId,
  getEntityCode,
  isRelationChanged,
  toSlug,
} from "../../../../utils/helpers";

const MODEL_MAP = {
  shipment_origin: "api::shipment-origin.shipment-origin" as UID.ContentType,
  shipment_destination:
    "api::shipment-destination.shipment-destination" as UID.ContentType,
  shipment_method: "api::shipment-method.shipment-method" as UID.ContentType,
  shipment_metric: "api::shipment-metric.shipment-metric" as UID.ContentType,
};

const REQUIRED_RELATIONS = [
  "shipment_origin",
  "shipment_destination",
  "shipment_method",
  "shipment_metric",
];

function getExpectedCode(
  originCode: string,
  destCode: string,
  methodCode: string,
  metricCode: string
): string {
  return toSlug(`${originCode} ${destCode} ${methodCode} ${metricCode}`);
}

async function getRelationCode(
  relation: string,
  data: Record<string, any>,
  fallback: string
) {
  const [newId] = getConnectRelationId(data[relation]);
  if (newId) {
    const code = await getEntityCode(MODEL_MAP[relation], newId);
    if (!code)
      throw new errors.ValidationError(
        `Could not resolve code for ${relation}`
      );
    return code;
  }
  if (
    data[relation] &&
    Array.isArray(data[relation].disconnect) &&
    data[relation].disconnect.length > 0 &&
    (!data[relation].connect || data[relation].connect.length === 0)
  ) {
    throw new errors.ValidationError(
      `${relation.replace("_", " ")} is required and cannot be disconnected.`
    );
  }
  return fallback;
}

async function validateRequiredRelations(data: Record<string, any>) {
  const ids = REQUIRED_RELATIONS.map(
    (rel) => getConnectRelationId(data[rel])[0]
  );

  if (ids.some((id) => !id)) {
    throw new errors.ValidationError(
      "Origin, destination, method, and metric are required to generate the code."
    );
  }
  return ids;
}

async function fetchCodes(ids: string[]) {
  return Promise.all([
    getEntityCode(MODEL_MAP.shipment_origin, ids[0]),
    getEntityCode(MODEL_MAP.shipment_destination, ids[1]),
    getEntityCode(MODEL_MAP.shipment_method, ids[2]),
    getEntityCode(MODEL_MAP.shipment_metric, ids[3]),
  ]);
}

export default {
  async beforeCreate(event: Event) {
    const { data } = event.params;
    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    const ids = await validateRequiredRelations(data);
    const codes = await fetchCodes(ids);
    if (codes.some((c) => !c)) {
      throw new errors.ValidationError(
        "Could not resolve all codes for code generation."
      );
    }
    const expectedCode = getExpectedCode(...codes);
    if (!data.code || data.code !== expectedCode) {
      data.code = expectedCode;
    }
    // Ensure code is unique
    const existing = await strapi
      .documents("api::freight-rate.freight-rate")
      .findFirst({ filters: { code: data.code } });
    if (existing) {
      throw new errors.ValidationError(
        `A freight rate with code '${data.code}' already exists.`
      );
    }
  },
  async beforeUpdate(event: Event) {
    const { data, where } = event.params;
    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    // Get freight rate
    const freightRate = await strapi
      .documents("api::freight-rate.freight-rate")
      .findFirst({
        filters: { id: where.id },
        populate: Object.fromEntries(REQUIRED_RELATIONS.map((r) => [r, true])),
      });
    if (!freightRate) {
      throw new errors.NotFoundError(
        `Freight rate with ID ${where.id} not found.`
      );
    }

    if (!REQUIRED_RELATIONS.some((rel) => isRelationChanged(rel, data))) {
      return;
    }
    const codes = await Promise.all(
      REQUIRED_RELATIONS.map((rel) =>
        getRelationCode(rel, data, freightRate[rel]?.code)
      )
    );
    if (codes.some((c) => !c)) {
      throw new errors.ValidationError(
        "Origin, destination, method, and metric are required to generate the code."
      );
    }
    const expectedCode = getExpectedCode(
      codes[0],
      codes[1],
      codes[2],
      codes[3]
    );
    if (!data.code || data.code !== expectedCode) {
      data.code = expectedCode;
    }
    // Ensure code is unique
    const existing = await strapi
      .documents("api::freight-rate.freight-rate")
      .findFirst({
        filters: { code: data.code, id: { $ne: where.id } },
      });
    if (existing) {
      throw new errors.ValidationError(
        `A freight rate with code '${data.code}' already exists.`
      );
    }
  },
};
