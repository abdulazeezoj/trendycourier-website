import { type Event } from "@strapi/database/dist/lifecycles";
import { errors } from "@strapi/utils";
import { toSlug } from "../../../../utils/helpers";

function getExpectedCode(name: string): string {
  return toSlug(name);
}

function validateMetricFields(
  data: Record<string, any>,
  existing?: Record<string, any>
) {
  // Use data if present, otherwise fallback to existing
  const min = data.min !== undefined ? data.min : existing?.min;
  const max = data.max !== undefined ? data.max : existing?.max;
  const multiple =
    data.multiple !== undefined ? data.multiple : existing?.multiple;
  const unit = data.unit !== undefined ? data.unit : existing?.unit;

  if (min === undefined || min === null || isNaN(Number(min))) {
    throw new errors.ValidationError("'min' is required and must be a number.");
  }
  if (max === undefined || max === null || isNaN(Number(max))) {
    throw new errors.ValidationError("'max' is required and must be a number.");
  }
  if (multiple === undefined || multiple === null || isNaN(Number(multiple))) {
    throw new errors.ValidationError(
      "'multiple' is required and must be a number."
    );
  }
  if (Number(min) < 0) {
    throw new errors.ValidationError(
      "'min' must be greater than or equal to 0."
    );
  }
  if (Number(max) <= Number(min)) {
    throw new errors.ValidationError("'max' must be greater than 'min'.");
  }
  if (Number(multiple) <= 0) {
    throw new errors.ValidationError("'multiple' must be greater than 0.");
  }
  if (Number(max) - Number(min) < Number(multiple)) {
    throw new errors.ValidationError(
      "'multiple' must fit within the range from 'min' to 'max'."
    );
  }
  if (!unit || typeof unit !== "string" || !unit.trim()) {
    throw new errors.ValidationError(
      "'unit' is required and must be a non-empty string."
    );
  }
}

export default {
  async beforeCreate(event: Event) {
    const { data } = event.params;
    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    // Validate metric fields
    validateMetricFields(data);

    // Ensure name is present
    if (!data.name) {
      throw new errors.ValidationError("Name is required to generate code.");
    }
    const expectedCode = getExpectedCode(data.name);
    if (!data.code || data.code !== expectedCode) {
      data.code = expectedCode;
    }
    // Ensure code is unique
    const existing = await strapi
      .documents("api::shipment-metric.shipment-metric")
      .findFirst({ filters: { code: data.code } });
    if (existing) {
      throw new errors.ValidationError(
        `A shipment metric with code '${data.code}' already exists.`
      );
    }
  },
  async beforeUpdate(event: Event) {
    const { data, where } = event.params;
    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    // Get current entity
    const shipmentMetric = await strapi
      .documents("api::shipment-metric.shipment-metric")
      .findFirst({ filters: { id: where.id } });
    if (!shipmentMetric) {
      throw new errors.NotFoundError(
        `Shipment metric with ID ${where.id} not found.`
      );
    }
    // Validate metric fields
    validateMetricFields(data, shipmentMetric);

    // Regenerate code if name is being changed
    if (typeof data.name === "string" && data.name !== shipmentMetric.name) {
      const expectedCode = getExpectedCode(data.name);
      if (!data.code || data.code !== expectedCode) {
        data.code = expectedCode;
      }
      // Ensure code is unique
      const existing = await strapi.documents("api::shipment-metric.shipment-metric").findFirst({
        filters: { code: data.code, id: { $ne: where.id } },
      });
      if (existing) {
        throw new errors.ValidationError(
          `A shipment metric with code '${data.code}' already exists.`
        );
      }
    }
  },
};
