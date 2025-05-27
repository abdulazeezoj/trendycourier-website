interface RelationInput {
  connect?: { id: string }[];
  set?: { id: string }[];
}

/**
 * Extracts the IDs from a RelationInput object.
 * It returns an array of IDs that are connected in the relation.
 * If no connections are found, it returns an empty array.
 * @param rel RelationInput
 * @returns string[] - Array of IDs from the connect relation
 */
function getConnectRelationId(rel: RelationInput): string[] {
  return rel?.connect?.map((conn) => conn.id) ?? [];
}

/**
 * @param rel RelationInput
 * @description Extracts the IDs from a RelationInput object.
 * It returns an array of IDs that are set in the relation.
 * If no sets are found, it returns an empty array.
 * @returns string[] - Array of IDs from the set relation
 */
function getSetRelationId(rel: RelationInput): string[] {
  return rel?.set?.map((conn) => conn.id) ?? [];
}

/**
 * Converts a string to title case.
 *
 * @param str - The input string to convert.
 * @returns string - The converted string in title case.
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Converts a string to a URL-friendly slug.
 *
 * @param str - The input string to convert.
 * @param lower - Whether to convert the string to lowercase (default is true).
 * @returns string - The converted string in slug format.
 */
function toSlug(str: string, lower: boolean = true): string {
  return (lower ? str.toLowerCase() : str)
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with a single hyphen
}

export { getConnectRelationId, getSetRelationId, toSlug, toTitleCase };
export type { RelationInput };
