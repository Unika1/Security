import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  validate,
  registerSchema,
  loginSchema,
  otpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../lib/validation.js";
import { requireCsrf } from "../middleware/csrf.js";
import { createToken, authCookieOptions, AUTH_COOKIE } from "../lib/auth.js";
import { sendOtpEmail, sendResetEmail } from "../utils/mailer.js";

const router = express.Router();
const MAX_OTP_ATTEMPTS = 5;
const OTP_MINUTES = 5; // how long a code stays valid
const RESEND_COOLDOWN_SECONDS = 30; // minimum wait between two codes

// Generate a fresh 6-digit code for this user, save its hash, and email it.
// Used by both login (first code) and resend-otp (replacement code).
async function issueOtp(user) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  user.otpHash = await bcrypt.hash(code, 10);
  user.otpExpiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
  user.otpAttempts = 0;
  await user.save();
  await sendOtpEmail(user.email, code);
}

// POST /api/auth/register -> create an account (does NOT log in)
router.post("/register", requireCsrf, async (req, res) => {
  try {
    const check = validate(registerSchema, req.body);
    if (!check.ok) return res.status(400).json({ error: check.error });
    const { name, email, password } = check.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    return res.status(201).json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/login -> STEP 1: check password, email a 6-digit code
router.post("/login", requireCsrf, async (req, res) => {
  try {
    const check = validate(loginSchema, req.body);
    if (!check.ok) return res.status(400).json({ error: check.error });
    const { email, password } = check.data;

    const user = await User.findOne({ email });
    const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;
    // Same error for unknown email and wrong password (don't reveal which).
    if (!user || !passwordOk) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    await issueOtp(user);
    return res.json({ otpRequired: true, email });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/resend-otp -> email a fresh code (only mid-login, with cooldown)
router.post("/resend-otp", requireCsrf, async (req, res) => {
  try {
    const check = validate(resendOtpSchema, req.body);
    if (!check.ok) return res.status(400).json({ error: check.error });
    const { email } = check.data;

    const user = await User.findOne({ email });
    // Only resend when a login is actually in progress (password step passed).
    // Otherwise this endpoint could be used to send emails to anyone.
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ error: "No login in progress. Please log in again." });
    }

    // Cooldown: a code is issued OTP_MINUTES before it expires, so we can
    // work out when the last one was sent without storing an extra field.
    const issuedAt = user.otpExpiresAt.getTime() - OTP_MINUTES * 60 * 1000;
    const secondsSinceLast = (Date.now() - issuedAt) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast);
      return res.status(429).json({
        error: `Please wait ${wait} more second${wait === 1 ? "" : "s"} before requesting a new code.`,
      });
    }

    await issueOtp(user);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/verify-otp -> STEP 2: check the code, then log in
router.post("/verify-otp", requireCsrf, async (req, res) => {
  try {
    const check = validate(otpSchema, req.body);
    if (!check.ok) return res.status(400).json({ error: check.error });
    const { email, code } = check.data;

    const user = await User.findOne({ email });
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ error: "No active code. Please log in again." });
    }
    if (user.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: "Your code has expired. Please log in again." });
    }
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.otpHash = null;
      user.otpExpiresAt = null;
      await user.save();
      return res.status(429).json({ error: "Too many attempts. Please log in again." });
    }

    const codeOk = await bcrypt.compare(code, user.otpHash);
    if (!codeOk) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(401).json({ error: "Incorrect code. Please try again." });
    }

    // Success — clear the one-time code and log in.
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    const token = createToken(user._id.toString());
    res.cookie(AUTH_COOKIE, token, authCookieOptions());
    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/forgot-password -> STEP 1: email a reset code.
// NOTE: the answer is the same whether the account exists or not, so this
// form can't be used to find out which emails are registered.
router.post("/forgot-password", requireCsrf, async (req, res) => {
  try {
    const check = validate(forgotPasswordSchema, req.body);
    if (!check.ok) return res.status(400).json({ error: check.error });
    const { email } = check.data;

    const user = await User.findOne({ email });
    if (user) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      user.resetHash = await bcrypt.hash(code, 10);
      user.resetExpiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
      user.resetAttempts = 0;
      await user.save();
      await sendResetEmail(email, code);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/reset-password -> STEP 2: check the code, set the new password
router.post("/reset-password", requireCsrf, async (req, res) => {
  try {
    const check = validate(resetPasswordSchema, req.body);
    if (!check.ok) return res.status(400).json({ error: check.error });
    const { email, code, password } = check.data;

    const user = await User.findOne({ email });
    if (!user || !user.resetHash || !user.resetExpiresAt) {
      return res.status(400).json({ error: "No reset in progress. Please request a code first." });
    }
    if (user.resetExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: "Your code has expired. Please request a new one." });
    }
    if (user.resetAttempts >= MAX_OTP_ATTEMPTS) {
      user.resetHash = null;
      user.resetExpiresAt = null;
      await user.save();
      return res.status(429).json({ error: "Too many attempts. Please request a new code." });
    }

    const codeOk = await bcrypt.compare(code, user.resetHash);
    if (!codeOk) {
      user.resetAttempts += 1;
      await user.save();
      return res.status(401).json({ error: "Incorrect code. Please try again." });
    }

    // Success — store the new password and clear ALL one-time codes.
    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetHash = null;
    user.resetExpiresAt = null;
    user.resetAttempts = 0;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/logout -> clear the login cookie
router.post("/logout", requireCsrf, (req, res) => {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
  return res.json({ ok: true });
});

// GET /api/auth/me -> return the logged-in user (or null)
router.get("/me", async (req, res) => {
  // We don't use requireAuth here because "not logged in" is a normal answer.
  try {
    const token = req.cookies?.[AUTH_COOKIE];
    if (!token) return res.json({ user: null });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.json({ user: null });
    }

    const user = await User.findById(payload.userId).select("name email role createdAt");
    return res.json({ user });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

export default router;
