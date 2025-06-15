import { type Event } from "@strapi/database/dist/lifecycles";
import { errors } from "@strapi/utils";
import { toSlug } from "../../../../utils/helpers";

function getExpectedCode(city: string, country: string): string {
  return toSlug(`${city} ${country}`);
}

export default {
  async beforeCreate(event: Event) {
    const { data } = event.params;

    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    // Validate city and country
    if (!data.city || !data.country) {
      throw new errors.ValidationError(
        "City and country are required to generate the code."
      );
    }

    // Generate expected code
    const expectedCode = getExpectedCode(data.city, data.country);

    // Set code to expected code if not provided or doesn't match
    if (!data.code || data.code !== expectedCode) {
      data.code = expectedCode;
    }

    // Ensure code is unique
    const existing = await strapi
      .documents("api::shipment-origin.shipment-origin")
      .findFirst({
        filters: {
          code: data.code,
        },
      });
    if (existing) {
      throw new errors.ValidationError(
        `A shipment origin with code '${data.code}' already exists.`
      );
    }
  },
  async beforeUpdate(event: Event) {
    const { data, where } = event.params;

    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    // Validate city and country
    if (!data.city || !data.country) {
      throw new errors.ValidationError(
        "City and country are required to generate the code."
      );
    }

    // Generate expected code
    const expectedCode = getExpectedCode(data.city, data.country);

    // Set code to expected code if not provided or doesn't match
    if (!data.code || data.code !== expectedCode) {
      data.code = expectedCode;
    }

    // Ensure code is unique
    const existing = await strapi
      .documents("api::shipment-origin.shipment-origin")
      .findFirst({
        filters: {
          code: data.code,
          id: { $ne: where.id }, // Exclude current record
        },
      });
    if (existing) {
      throw new errors.ValidationError(
        `A shipment origin with code '${data.code}' already exists.`
      );
    }
  },
};
