import { z } from "zod";

// DTO => Data Transfer Object

export const CreateHotelDTO = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  rating: z.coerce.number().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  reviews: z.coerce.number().int().min(0, "Reviews must be a positive number"),
  image: z.string().min(1, "Image is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  description: z.string().min(1, "Description is required"),
});

export const UpdateHotelDTO = CreateHotelDTO;
