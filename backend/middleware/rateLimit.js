import rateLimit from "express-rate-limit";

/*
  Brute-force protection with rate limiting.

  Repeated password guesses, OTP guesses or reset requests from the same IP
  are throttled. Once the limit is hit, further requests get 429 (Too Many
  Requests) until the time window passes — this defeats automated
  credential-stuffing and brute-force attacks.
*/

// Tight limit for the sensitive auth actions (login, OTP, password reset).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per window
  standardHeaders: true, // send RateLimit-* headers so clients can see limits
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});

// Gentler limit for account creation.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 new accounts per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many accounts created from here. Please try again later." },
});
