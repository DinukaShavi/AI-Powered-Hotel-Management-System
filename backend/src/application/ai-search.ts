import { Request, Response, NextFunction } from "express";
import Anthropic from "@anthropic-ai/sdk";

import Hotel from "../infrastructure/schemas/Hotel";
import anthropic from "../infrastructure/anthropic-client";
import ValidationError from "../domain/errors/validation-error";
import {
  AISearchRequestDTO,
  AISearchCriteriaDTO,
} from "../domain/dtos/ai-search";

// Escapes regex metacharacters in AI-supplied strings before they reach a
// $regex value, so they can only ever match literal text, not run as regex.
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Mirrors AISearchCriteriaDTO. Kept as a hand-written JSON schema (rather than
// derived from the zod schema) because output_config.format needs a plain
// JSON Schema object, and the zod schema is validated separately below anyway
// — the AI's output is untrusted regardless of what schema we asked it to follow.
const AI_CRITERIA_JSON_SCHEMA = {
  type: "object",
  properties: {
    location: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description:
        "City or place name mentioned in the query, e.g. 'Colombo'. Null if none mentioned.",
    },
    minPrice: {
      anyOf: [{ type: "number" }, { type: "null" }],
      description:
        "Minimum nightly price mentioned in the query, if any. Null otherwise.",
    },
    maxPrice: {
      anyOf: [{ type: "number" }, { type: "null" }],
      description:
        "Maximum nightly price mentioned in the query, e.g. 'under 20000' => 20000. Null otherwise.",
    },
    minRating: {
      anyOf: [{ type: "number" }, { type: "null" }],
      description:
        "Minimum star rating from 1 to 5 if the query implies a quality bar. Null otherwise.",
    },
    searchText: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description:
        "Other descriptive keywords from the query not already captured above (e.g. amenities like 'pool', or an audience like 'family'), to match against the hotel's name and description. Null if nothing extra.",
    },
  },
  required: ["location", "minPrice", "maxPrice", "minRating", "searchText"],
  additionalProperties: false,
};

export const aiSearchHotels = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationResult = AISearchRequestDTO.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.issues[0].message);
    }
    const { query } = validationResult.data;

    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      thinking: { type: "disabled" },
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: AI_CRITERIA_JSON_SCHEMA },
      },
      system:
        "You extract hotel search criteria from a natural-language request. Only extract facts explicitly present in the query - never invent a location, price, or rating. Use null for anything not mentioned.",
      messages: [{ role: "user", content: query }],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    if (!textBlock) {
      throw new Error("AI search did not return a result");
    }

    // The AI's output is untrusted structured data - it is parsed and
    // re-validated against the same schema before any of it is used to
    // build a database query, never executed or trusted directly.
    const criteriaResult = AISearchCriteriaDTO.safeParse(
      JSON.parse(textBlock.text)
    );
    if (!criteriaResult.success) {
      throw new Error("AI search returned an unexpected response shape");
    }
    const criteria = criteriaResult.data;

    const mongoQuery: Record<string, unknown> = {};

    if (criteria.location) {
      mongoQuery.location = {
        $regex: escapeRegExp(criteria.location),
        $options: "i",
      };
    }

    if (criteria.minPrice !== null || criteria.maxPrice !== null) {
      const priceFilter: Record<string, number> = {};
      if (criteria.minPrice !== null) {
        priceFilter.$gte = criteria.minPrice;
      }
      if (criteria.maxPrice !== null) {
        priceFilter.$lte = criteria.maxPrice;
      }
      mongoQuery.price = priceFilter;
    }

    if (criteria.minRating !== null) {
      const clampedRating = Math.min(5, Math.max(1, criteria.minRating));
      mongoQuery.rating = { $gte: clampedRating };
    }

    if (criteria.searchText) {
      const textRegex = {
        $regex: escapeRegExp(criteria.searchText),
        $options: "i",
      };
      mongoQuery.$or = [{ name: textRegex }, { description: textRegex }];
    }

    const hotels = await Hotel.find(mongoQuery);

    res.status(200).json(hotels);
    return;
  } catch (error) {
    next(error);
  }
};
