import rateLimit from "express-rate-limit";

/*
  Brute-force protection with rate limiting.

  Repeated password guesses, OTP guesses or reset requests from the same IP
  are throttled. Once the limit is hit, further requests get 429 (Too Many
  Requests) until the time window passes — this defeats automated
  credential-stuffing and brute-force attacks.
*/

// Limit for the sensitive auth actions (login, OTP, password reset).
// This is a per-IP safety net against automated flooding. It is deliberately
// generous so normal use (and testing) is never blocked; the per-account
// lockout in the login route is the tighter, targeted brute-force defence.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // up to 50 requests per IP per window
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
