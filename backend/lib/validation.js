import { z } from "zod";

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

// Run a schema; return { ok, data } or { ok:false, error }.
export function validate(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues[0]?.message || "Invalid input." };
}
