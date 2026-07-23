import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";

export const AUTH_COOKIE = "citymate_token";
const TOKEN_DAYS = 7;
const isProd = process.env.NODE_ENV === "production";

// Make a short fingerprint of the device from its browser user-agent.
// We store this in the token so the session is tied to one device.
export function deviceId(req) {
  const ua = req.get?.("user-agent") || "";
  return crypto.createHash("sha256").update(ua).digest("hex").slice(0, 16);
}

// Make a signed login token (JWT) for a user id, tied to their device.
export function createToken(userId, device) {
  return jwt.sign({ userId, device }, process.env.JWT_SECRET, {
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

    // Session binding: the token must be used from the same device it was
    // issued to. If the device fingerprint does not match, reject it. This
    // means a stolen cookie cannot be reused from another browser.
    if (payload.device && payload.device !== deviceId(req)) {
      return res.status(401).json({ error: "Session not valid for this device. Please log in again." });
    }

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
