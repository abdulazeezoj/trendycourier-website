import { type Event } from "@strapi/database/dist/lifecycles";
import { UID } from "@strapi/types";
import { errors } from "@strapi/utils";
import { getConnectRelationId, toSlug } from "../../../../utils/helpers";

async function getEntityCode(
  model: UID.ContentType,
  id: any,
  codeField = "code",
  nameField = "name"
) {
  if (!id) return null;

  const entity = await strapi.documents(model).findFirst({
    filters: {
      id: id,
    },
  });

  return entity?.[codeField] || entity?.[nameField] || null;
}

function getExpectedCode(
  originCode: string,
  destCode: string,
  methodCode: string,
  metricCode: string
): string {
  return toSlug(`${originCode}-${destCode}-${methodCode}-${metricCode}`);
}

export default {
  async beforeCreate(event: Event) {
    const { data } = event.params;

    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    // Validate all required relations
    const [originId] = getConnectRelationId(data.shipment_origin);
    const [destId] = getConnectRelationId(data.shipment_destination);
    const [methodId] = getConnectRelationId(data.shipment_method);
    const [metricId] = getConnectRelationId(data.shipment_metric);

    if (!originId || !destId || !methodId || !metricId) {
      throw new errors.ValidationError(
        "Origin, destination, method, and metric are required to generate the code."
      );
    }

    // Fetch codes/names
    const [originCode, destCode, methodCode, metricCode] = await Promise.all([
      getEntityCode("api::shipment-origin.shipment-origin", originId),
      getEntityCode("api::shipment-destination.shipment-destination", destId),
      getEntityCode("api::shipment-method.shipment-method", methodId),
      getEntityCode("api::shipment-metric.shipment-metric", metricId),
    ]);

    if (!originCode || !destCode || !methodCode || !metricCode) {
      throw new errors.ValidationError(
        "Could not resolve all codes for code generation."
      );
    }

    const expectedCode = getExpectedCode(
      originCode,
      destCode,
      methodCode,
      metricCode
    );
    if (!data.code || data.code !== expectedCode) {
      data.code = expectedCode;
    }

    // Ensure code is unique
    const existing = await strapi
      .documents("api::freight-rate.freight-rate")
      .findFirst({
        filters: { code: data.code },
      });
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
        populate: {
          shipment_origin: true,
          shipment_destination: true,
          shipment_method: true,
          shipment_metric: true,
        },
      });
    if (!freightRate) {
      throw new errors.NotFoundError(
        `Freight rate with ID ${where.id} not found.`
      );
    }

    // Validate all required relations
    const [originId] = getConnectRelationId(data.shipment_origin);
    const [destId] = getConnectRelationId(data.shipment_destination);
    const [methodId] = getConnectRelationId(data.shipment_method);
    const [metricId] = getConnectRelationId(data.shipment_metric);

    // get the relation(s) that are set and ignore the ones that are not set
    const setRelationIds = {
      shipment_origin: originId ? true : false,
      shipment_destination: destId ? true : false,
      shipment_method: methodId ? true : false,
      shipment_metric: metricId ? true : false,
    };

    let regenerateCode = Object.values(setRelationIds).some((isSet) => isSet);

    // Regenerate code if any relation has changed
    if (regenerateCode) {
      // Helper to get the correct relation code for code generation
      const getRelationCode = async (relation: string, fallback: string) => {
        // Map relation to model name
        const modelMap = {
          shipment_origin: "api::shipment-origin.shipment-origin",
          shipment_destination:
            "api::shipment-destination.shipment-destination",
          shipment_method: "api::shipment-method.shipment-method",
          shipment_metric: "api::shipment-metric.shipment-metric",
        };

        // If connect is non-empty, use the new relation
        const [newId] = getConnectRelationId(data[relation]);
        if (newId) {
          const code = await getEntityCode(modelMap[relation], newId);
          if (!code)
            throw new errors.ValidationError(
              `Could not resolve code for ${relation}`
            );
          return code;
        }

        // If disconnect is non-empty and connect is empty, treat as missing (required)
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

        // Otherwise, use the fallback (existing relation code)
        return fallback;
      };

      // Only regenerate code if any relation is being changed (connect/disconnect present and not empty)
      const isRelationChanged = (field) => {
        const rel = data[field];
        return (
          rel &&
          ((Array.isArray(rel.connect) && rel.connect.length > 0) ||
            (Array.isArray(rel.disconnect) && rel.disconnect.length > 0))
        );
      };
      if (
        !(
          isRelationChanged("shipment_origin") ||
          isRelationChanged("shipment_destination") ||
          isRelationChanged("shipment_method") ||
          isRelationChanged("shipment_metric")
        )
      ) {
        // No code-related relation changed, skip code regeneration
        return;
      }

      // Get the correct codes for code generation
      const [originCode, destCode, methodCode, metricCode] = await Promise.all([
        getRelationCode("shipment_origin", freightRate.shipment_origin?.code),
        getRelationCode(
          "shipment_destination",
          freightRate.shipment_destination?.code
        ),
        getRelationCode("shipment_method", freightRate.shipment_method?.code),
        getRelationCode("shipment_metric", freightRate.shipment_metric?.code),
      ]);

      if (!originCode || !destCode || !methodCode || !metricCode) {
        throw new errors.ValidationError(
          "Origin, destination, method, and metric are required to generate the code."
        );
      }

      const expectedCode = getExpectedCode(
        originCode,
        destCode,
        methodCode,
        metricCode
      );
      if (!data.code || data.code !== expectedCode) {
        data.code = expectedCode;
      }

      // Ensure code is unique
      const existing = await strapi
        .documents("api::freight-rate.freight-rate")
        .findFirst({
          filters: {
            code: data.code,
            id: { $ne: where.id },
          },
        });
      if (existing) {
        throw new errors.ValidationError(
          `A freight rate with code '${data.code}' already exists.`
        );
      }
    }
  },
};
