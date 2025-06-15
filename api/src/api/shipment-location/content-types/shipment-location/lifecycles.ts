import { type Event } from "@strapi/database/dist/lifecycles";
import { errors } from "@strapi/utils";
import { toSlug } from "../../../../utils/helpers";

function getExpectedCode(name: string): string {
  return toSlug(`${name}`);
}

function validateLocationFields(
  data: Record<string, any>,
  existing?: Record<string, any>
) {
  const name = data.name !== undefined ? data.name : existing?.name;
  const city = data.city !== undefined ? data.city : existing?.city;
  const country = data.country !== undefined ? data.country : existing?.country;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new errors.ValidationError(
      "'name' is required and must be a non-empty string."
    );
  }
  if (!city || typeof city !== "string" || !city.trim()) {
    throw new errors.ValidationError(
      "'city' is required and must be a non-empty string."
    );
  }
  if (!country || typeof country !== "string" || !country.trim()) {
    throw new errors.ValidationError(
      "'country' is required and must be a non-empty string."
    );
  }
}

export default {
  async beforeCreate(event: Event) {
    const { data } = event.params;

    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    validateLocationFields(data);

    // Ensure required fields are present
    if (!data.name || !data.city || !data.country) {
      throw new errors.ValidationError(
        "Name, city, and country are required to generate code."
      );
    }
    const expectedCode = getExpectedCode(data.name);
    if (!data.code || data.code !== expectedCode) {
      data.code = expectedCode;
    }
    // Ensure code is unique
    const existing = await strapi
      .documents("api::shipment-location.shipment-location")
      .findFirst({ filters: { code: data.code } });
    if (existing) {
      throw new errors.ValidationError(
        `A shipment location with code '${data.code}' already exists.`
      );
    }
  },
  async beforeUpdate(event: Event) {
    const { data, where } = event.params;

    // Skip second invocation (Draft & Publish)
    if (data.publishedAt) return;

    const shipmentLocation = await strapi
      .documents("api::shipment-location.shipment-location")
      .findFirst({ filters: { id: where.id } });
    if (!shipmentLocation) {
      throw new errors.NotFoundError(
        `Shipment location with ID ${where.id} not found.`
      );
    }

    validateLocationFields(data, shipmentLocation);

    // Regenerate code if any relevant field is being changed
    const name = data.name !== undefined ? data.name : shipmentLocation.name;
    const expectedCode = getExpectedCode(name);
    if (!data.code || data.code !== expectedCode) {
      data.code = expectedCode;
    }
    // Ensure code is unique
    const existing = await strapi
      .documents("api::shipment-location.shipment-location")
      .findFirst({
        filters: { code: data.code, id: { $ne: where.id } },
      });
    if (existing) {
      throw new errors.ValidationError(
        `A shipment location with code '${data.code}' already exists.`
      );
    }
  },
};
