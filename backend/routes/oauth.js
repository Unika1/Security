import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import { createToken, authCookieOptions, AUTH_COOKIE, deviceId } from "../lib/auth.js";
import { logEvent } from "../lib/audit.js";

/*
  "Sign in with Google" using OAuth 2.0.

  Flow:
  1. The user clicks the Google button, which sends them to /api/auth/google.
  2. We redirect them to Google's sign-in page.
  3. Google sends them back to /callback with a one-time code.
  4. We swap that code for the user's Google profile (email + name).
  5. We find or create the account, then issue our own login cookie.

  A random "state" value is used to protect the flow against CSRF.
*/

const router = express.Router();

// This must match the redirect URI registered in Google Cloud Console.
const REDIRECT_URI = "http://localhost:5000/api/auth/google/callback";
// Where to send the user after login (the frontend).
const FRONTEND_URL = process.env.FRONTEND_URL || "https://localhost:3000";

// GET /api/auth/google -> send the user to Google to sign in.
router.get("/", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  res.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + params.toString());
});

// GET /api/auth/google/callback -> Google returns the user here with a code.
router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    // Check the state matches the one we set (CSRF protection).
    if (!state || state !== req.cookies?.oauth_state) {
      return res.redirect(FRONTEND_URL + "/login?error=oauth");
    }
    res.clearCookie("oauth_state", { path: "/" });
    if (!code) return res.redirect(FRONTEND_URL + "/login?error=oauth");

    // Swap the code for tokens.
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return res.redirect(FRONTEND_URL + "/login?error=oauth");

    // Get the user's Google profile.
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();
    const email = (profile.email || "").toLowerCase();
    if (!email) return res.redirect(FRONTEND_URL + "/login?error=oauth");

    // Find the account, or create one for this Google user.
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: profile.name || email.split("@")[0],
        email,
        provider: "google",
        googleId: profile.id,
        passwordChangedAt: new Date(),
      });
      await logEvent(req, "register_google", { email, userId: user._id });
    }

    // Issue our own device-bound login cookie and go to the app.
    const token = createToken(user._id.toString(), deviceId(req));
    res.cookie(AUTH_COOKIE, token, authCookieOptions());
    await logEvent(req, "login_google", { email, userId: user._id });
    return res.redirect(FRONTEND_URL + "/profile");
  } catch (err) {
    console.error("Google OAuth error:", err);
    return res.redirect(FRONTEND_URL + "/login?error=oauth");
  }
});

export default router;
