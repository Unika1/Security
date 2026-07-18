import { z } from "zod";
import { CITIES } from "../models/Tour.js";

// We use zod to check all data coming from the browser.
// If the data does not match the rules below it is rejected before it
// reaches the database. This helps stop bad input and injection attacks.

// Password rules, used by both register and reset password.
// A password needs 8+ characters with upper, lower, a number and a symbol.
export const passwordPolicy = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(100, "Password must be 100 characters or less.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol (e.g. !?@#).");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  password: passwordPolicy,
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

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  code: z.string().trim().regex(/^\d{6}$/, "The code must be 6 digits."),
  password: passwordPolicy,
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
  // Only allow our own uploaded image path or an empty string.
  // This value is used in an image tag so we do not accept random text.
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
