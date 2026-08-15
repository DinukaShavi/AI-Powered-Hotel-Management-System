import { z } from "zod";

export const AISearchRequestDTO = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(500, "Search query is too long"),
});

// The shape Claude is asked to return, and the schema its response is
// validated against before it ever touches a MongoDB query. Only fields
// that exist on the Hotel model are represented here — "searchText" is the
// deliberate fallback for concepts (amenities, audience, etc.) the schema
// has no dedicated field for; it's matched against name/description text
// instead of invented as a fake structured field.
export const AISearchCriteriaDTO = z.object({
  location: z.string().nullable(),
  minPrice: z.number().nullable(),
  maxPrice: z.number().nullable(),
  // Not bounded here: JSON Schema numeric constraints (minimum/maximum)
  // aren't enforceable via structured outputs, so an out-of-range value from
  // the model is expected input, not a validation failure - it gets clamped
  // to [1, 5] where the query is built instead of failing the whole search.
  minRating: z.number().nullable(),
  searchText: z.string().nullable(),
});
