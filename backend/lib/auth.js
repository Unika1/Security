import jwt from "jsonwebtoken";

export const AUTH_COOKIE = "citymate_token";
const TOKEN_DAYS = 7;
const isProd = process.env.NODE_ENV === "production";

// Create a signed login token from a user id.
export function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: `${TOKEN_DAYS}d`,
  });
}

// Cookie options for the login token.
//  - httpOnly: JavaScript can't read it (blocks token theft via XSS)
//  - sameSite "lax": sent on same-site requests (works between localhost ports)
//  - secure: HTTPS-only in production
export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: TOKEN_DAYS * 24 * 60 * 60 * 1000,
  };
}

/*
  Middleware that requires a logged-in user. Reads the login cookie, verifies
  the token, and attaches { userId } to req. Otherwise responds 401.
*/
export function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return res.status(401).json({ error: "Not logged in." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}
