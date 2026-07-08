import { z } from "zod";
import { CITIES } from "../models/Tour.js";

/*
  Input validation with zod. Never trust data from the browser — these schemas
  describe exactly what we accept. Anything else is rejected before it reaches
  the database (protects data integrity and helps prevent injection/XSS).
*/

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const otpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  code: z.string().trim().regex(/^\d{6}$/, "The code must be 6 digits."),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
});

export const tourSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(100, "Title must be 100 characters or less."),
  city: z.enum(CITIES, { message: "City must be one of the five CityMate cities." }),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(2000, "Description must be 2000 characters or less."),
  // z.coerce turns "3" (text from a form) into the number 3 before checking.
  durationHours: z.coerce
    .number({ message: "Duration must be a number of hours." })
    .min(1, "Duration must be at least 1 hour.")
    .max(72, "Duration cannot be more than 72 hours."),
  price: z.coerce
    .number({ message: "Price must be a number." })
    .min(0, "Price cannot be negative.")
    .max(1000000, "Price is too high."),
  highlights: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(80, "Each highlight must be 80 characters or less (separate them with commas).")
    )
    .max(10, "You can add at most 10 highlights.")
    .optional()
    .default([]),
  // Either one of our own uploaded files or empty. (No arbitrary text —
  // this value ends up in an <img src>.)
  imageUrl: z
    .string()
    .trim()
    .max(300)
    .refine((url) => url === "" || url.startsWith("/api/uploads/"), {
      message: "Image must be uploaded through the admin dashboard.",
    })
    .optional()
    .default(""),
});

// Run a schema; return { ok, data } or { ok:false, error }.
export function validate(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues[0]?.message || "Invalid input." };
}
