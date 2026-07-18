import crypto from "crypto";

export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

const isProd = process.env.NODE_ENV === "production";

// CSRF protection using the double-submit cookie method.
// issueCsrfToken gives the browser a random csrf_token cookie. It is not
// httpOnly so our own JavaScript can read it and send it back in a header.
// requireCsrf then checks the header matches the cookie on POST and similar
// requests. Another website cannot read our cookie so it cannot fake the
// header, and its request is blocked.

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
