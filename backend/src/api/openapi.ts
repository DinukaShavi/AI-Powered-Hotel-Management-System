import { Request, Response } from "express";

const errorResponse = (description: string, example: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: { message: example },
    },
  },
});

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Horizone Hotels API",
    version: "1.0.0",
    description: "Read-only access to hotel listings.",
  },
  security: [],
  paths: {
    "/api/hotels": {
      get: {
        operationId: "listHotels",
        summary: "List all hotels",
        tags: ["Hotels"],
        responses: {
          "200": {
            description: "All hotels.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Hotel" },
                },
              },
            },
          },
          "500": errorResponse("Unexpected server error.", "Internal Server Error"),
        },
      },
    },
    "/api/hotels/{id}": {
      get: {
        operationId: "getHotelById",
        summary: "Get a hotel by ID",
        tags: ["Hotels"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "MongoDB ObjectId of the hotel.",
            schema: { type: "string", pattern: "^[a-f0-9]{24}$" },
            example: "6aaa6acf5c57dd25eab78424",
          },
        ],
        responses: {
          "200": {
            description: "The requested hotel.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Hotel" },
              },
            },
          },
          "404": errorResponse(
            "No hotel exists with a well-formed ID.",
            "Hotel not found"
          ),
          "500": errorResponse(
            "Unexpected server error. Also returned for a malformed ID.",
            "Internal Server Error"
          ),
        },
      },
    },
  },
  components: {
    schemas: {
      Hotel: {
        type: "object",
        required: [
          "_id",
          "name",
          "location",
          "rating",
          "reviews",
          "image",
          "price",
          "description",
          "__v",
        ],
        properties: {
          _id: {
            type: "string",
            description: "MongoDB ObjectId.",
            example: "6aaa6acf5c57dd25eab78424",
          },
          name: { type: "string", example: "Maison Vérane" },
          location: {
            type: "string",
            description: 'City and country, e.g. "Paris, France".',
            example: "Paris, France",
          },
          rating: {
            type: "number",
            minimum: 1,
            maximum: 5,
            example: 4.8,
          },
          reviews: {
            type: "integer",
            minimum: 0,
            description: "Number of reviews.",
            example: 1284,
          },
          image: {
            type: "string",
            format: "uri",
            example:
              "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
          },
          price: {
            type: "number",
            minimum: 0,
            description: "Nightly price in USD.",
            example: 485,
          },
          description: {
            type: "string",
            example:
              "A boutique hotel in a restored Haussmann-era building in the 8th arrondissement.",
          },
          __v: {
            type: "integer",
            description: "Mongoose document version key.",
            example: 0,
          },
        },
      },
      Error: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
};

export const getOpenApiSpec = (req: Request, res: Response) => {
  res.status(200).json(openApiSpec);
};
