import { z } from "zod";

export const CreateBookingDTO = z
  .object({
    hotelId: z.string().min(1, "hotelId is required"),
    checkIn: z.coerce.date({ error: "checkIn is required" }),
    checkOut: z.coerce.date({ error: "checkOut is required" }),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });
