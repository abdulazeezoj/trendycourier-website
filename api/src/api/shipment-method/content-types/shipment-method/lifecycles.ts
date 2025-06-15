import { type Event } from "@strapi/database/dist/lifecycles";
import { errors } from "@strapi/utils";
import { toSlug } from "../../../../utils/helpers";

function getExpectedCode(name: string): string {
  return toSlug(name);
}

export default {
  async beforeCreate(event: Event) {
    const { data } = event.params;
    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

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
      .documents("api::shipment-method.shipment-method")
      .findFirst({ filters: { code: data.code } });
    if (existing) {
      throw new errors.ValidationError(
        `A shipment method with code '${data.code}' already exists.`
      );
    }
  },
  async beforeUpdate(event: Event) {
    const { data, where } = event.params;
    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    // Get current entity
    const shipmentMethod = await strapi
      .documents("api::shipment-method.shipment-method")
      .findFirst({ filters: { id: where.id } });
    if (!shipmentMethod) {
      throw new errors.NotFoundError(
        `Shipment method with ID ${where.id} not found.`
      );
    }
    // Regenerate code if name is being changed
    if (typeof data.name === "string" && data.name !== shipmentMethod.name) {
      const expectedCode = getExpectedCode(data.name);
      if (!data.code || data.code !== expectedCode) {
        data.code = expectedCode;
      }
      // Ensure code is unique
      const existing = await strapi
        .documents("api::shipment-method.shipment-method")
        .findFirst({
          filters: { code: data.code, id: { $ne: where.id } },
        });
      if (existing) {
        throw new errors.ValidationError(
          `A shipment method with code '${data.code}' already exists.`
        );
      }
    }
  },
};
