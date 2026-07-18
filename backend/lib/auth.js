import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const AUTH_COOKIE = "citymate_token";
const TOKEN_DAYS = 7;
const isProd = process.env.NODE_ENV === "production";

// Make a signed login token (JWT) for a user id.
export function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: `${TOKEN_DAYS}d`,
  });
}

// Settings for the login cookie.
// httpOnly means JavaScript cannot read it, which helps against XSS.
// sameSite lax means it is not sent from other sites, which helps against CSRF.
// secure means it is only sent over HTTPS in production.
export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: TOKEN_DAYS * 24 * 60 * 60 * 1000,
  };
}

// Check the user is logged in. Reads the cookie, checks the token,
// and saves the user id on the request. If not, sends 401.
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

// Check the user is an admin. Use it after requireAuth.
// We read the role from the database each time so the browser cannot fake it.
export async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId).select("role");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access only." });
    }
    next();
  } catch (err) {
    console.error("Admin check error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
}
