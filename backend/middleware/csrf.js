import crypto from "crypto";

export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

const isProd = process.env.NODE_ENV === "production";

/*
  CSRF protection — "double-submit cookie" pattern.

  1. issueCsrfToken: every response makes sure the browser has a random
     csrf_token cookie. It is NOT httpOnly, so the frontend JavaScript can
     read it and echo it back in a header.
  2. requireCsrf: on state-changing requests (POST etc.) we check that the
     x-csrf-token header matches the cookie. A malicious cross-site page can't
     read our cookie, so it can't forge the header — the request is blocked.
*/

export function issueCsrfToken(req, res, next) {
  if (!req.cookies?.[CSRF_COOKIE]) {
    res.cookie(CSRF_COOKIE, crypto.randomUUID(), {
      httpOnly: false,
      sameSite: "lax",
      secure: isProd,
      path: "/",
    });
  }
  next();
}

export function requireCsrf(req, res, next) {
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);
  if (!cookieToken || cookieToken !== headerToken) {
    return res
      .status(403)
      .json({ error: "Invalid security token. Please refresh and try again." });
  }
  next();
}
