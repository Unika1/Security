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
import { authLimiter, registerLimiter } from "../middleware/rateLimit.js";
import { createToken, authCookieOptions, AUTH_COOKIE, requireAuth, deviceId } from "../lib/auth.js";
import { sendOtpEmail, sendResetEmail } from "../utils/mailer.js";
import { logEvent } from "../lib/audit.js";
import { encrypt, decrypt } from "../lib/crypto.js";
import { isPasswordBreached } from "../lib/breachCheck.js";
import { makeCaptcha, verifyCaptcha } from "../lib/captcha.js";

const router = express.Router();
const MAX_OTP_ATTEMPTS = 5;
const OTP_MINUTES = 5; // how long a code stays valid
const RESEND_COOLDOWN_SECONDS = 30; // minimum wait between two codes
const PASSWORD_EXPIRY_DAYS = 90; // force a change after this many days
const MAX_FAILED_LOGINS = 8; // lock the account after this many wrong passwords
const LOCK_MINUTES = 5; // how long the account stays locked
const MAX_PREVIOUS_PASSWORDS = 5; // how many old passwords we remember

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

// GET /api/auth/captcha -> a fresh CAPTCHA image and its token
router.get("/captcha", (req, res) => {
  return res.json(makeCaptcha());
});

// POST /api/auth/register -> create an account (does NOT log in)
router.post("/register", registerLimiter, requireCsrf, async (req, res) => {
  try {
    // CAPTCHA check first, to block automated bots.
    if (!verifyCaptcha(req.body?.captchaToken, req.body?.captchaAnswer)) {
      return res.status(400).json({ error: "Incorrect CAPTCHA. Please try again." });
    }

    const check = validate(registerSchema, req.body);
    if (!check.ok) return res.status(400).json({ error: check.error });
    const { name, email, password } = check.data;

    // Reject passwords that appear in known data breaches.
    if (await isPasswordBreached(password)) {
      return res.status(400).json({
        error: "This password has appeared in a known data breach. Please choose a different one.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, passwordChangedAt: new Date() });
    await logEvent(req, "register", { email, userId: user._id });
    return res.status(201).json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/login -> STEP 1: check password, email a 6-digit code
router.post("/login", authLimiter, requireCsrf, async (req, res) => {
  try {
    const check = validate(loginSchema, req.body);
    if (!check.ok) return res.status(400).json({ error: check.error });
    const { email, password } = check.data;

    const user = await User.findOne({ email });

    // Account lockout: if this account is currently locked, refuse early.
    if (user && user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const mins = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      await logEvent(req, "login_locked", { email, userId: user._id });
      return res.status(423).json({
        error: `Account locked due to too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
      });
    }

    const passwordOk =
      user && user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
    // Same error for unknown email and wrong password (don't reveal which).
    if (!user || !passwordOk) {
      // Count the failed attempt against the account and lock if over the limit.
      if (user) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
          user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
          user.failedLoginAttempts = 0;
        }
        await user.save();
        await logEvent(req, "login_failed", { email, userId: user._id });
      } else {
        await logEvent(req, "login_failed", { email });
      }
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Correct password, so reset the failed attempt counters.
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // Password expiry: force a reset if the password is older than the limit.
    const ageDays = (Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > PASSWORD_EXPIRY_DAYS) {
      await user.save();
      await logEvent(req, "password_expired", { email, userId: user._id });
      return res.status(403).json({
        passwordExpired: true,
        error: "Your password has expired. Please reset it to continue.",
      });
    }

    await issueOtp(user); // also saves the user
    await logEvent(req, "login_password_ok", { email, userId: user._id });
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
router.post("/verify-otp", authLimiter, requireCsrf, async (req, res) => {
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

    // Code is correct, so clear it and log the user in.
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    // Bind the session to this device (see deviceId in lib/auth.js).
    const token = createToken(user._id.toString(), deviceId(req));
    res.cookie(AUTH_COOKIE, token, authCookieOptions());
    await logEvent(req, "login_success", { email, userId: user._id });
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
router.post("/forgot-password", authLimiter, requireCsrf, async (req, res) => {
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
router.post("/reset-password", authLimiter, requireCsrf, async (req, res) => {
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

    // Reject passwords that appear in known data breaches.
    if (await isPasswordBreached(password)) {
      return res.status(400).json({
        error: "This password has appeared in a known data breach. Please choose a different one.",
      });
    }

    // Password reuse prevention: the new password must not match the current
    // password or any old password we saved.
    // First make a list of all the old password hashes.
    const oldHashes = [user.passwordHash];
    for (const oldOne of user.previousPasswords || []) {
      oldHashes.push(oldOne);
    }
    // Then check the new password against each of them.
    for (const hash of oldHashes) {
      const isSame = await bcrypt.compare(password, hash);
      if (isSame) {
        return res.status(400).json({ error: "You cannot reuse a previous password." });
      }
    }

    // Code is correct. Remember the old password, save the new one, refresh dates,
    // clear all one-time codes, and unlock the account.
    const newHash = await bcrypt.hash(password, 10);

    // Add the current password to the front of the old-passwords list,
    // then keep only the newest few.
    user.previousPasswords.unshift(user.passwordHash);
    user.previousPasswords = user.previousPasswords.slice(0, MAX_PREVIOUS_PASSWORDS);

    user.passwordHash = newHash;
    user.passwordChangedAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.resetHash = null;
    user.resetExpiresAt = null;
    user.resetAttempts = 0;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    await logEvent(req, "password_reset", { email, userId: user._id });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/logout -> clear the login cookie
router.post("/logout", requireCsrf, async (req, res) => {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
  await logEvent(req, "logout");
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

    const user = await User.findById(payload.userId).select(
      "name email role createdAt phoneEncrypted"
    );
    if (!user) return res.json({ user: null });
    // Decrypt the phone number for its owner only, at read time.
    const userOut = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      phone: decrypt(user.phoneEncrypted),
    };
    return res.json({ user: userOut });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

// PUT /api/auth/profile -> update the logged-in user's profile (phone number).
// The phone is stored AES-encrypted; we never keep it in plaintext at rest.
router.put("/profile", requireCsrf, requireAuth, async (req, res) => {
  try {
    const phone = String(req.body?.phone ?? "").trim();
    if (phone && !/^[+\d][\d\s-]{6,19}$/.test(phone)) {
      return res.status(400).json({ error: "Please enter a valid phone number." });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    user.phoneEncrypted = phone ? encrypt(phone) : "";
    await user.save();
    await logEvent(req, "profile_update", { email: user.email, userId: user._id });
    return res.json({ ok: true, phone });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

export default router;
