import mongoose from "mongoose";

// This model is the shape of a user account in MongoDB.
// We never save the real password, only its bcrypt hash.
// The otp fields are used for the 6-digit two-factor login code.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Not required: users who sign in with Google have no password.
    passwordHash: { type: String, default: null },

    // How the account signs in: "local" (email + password) or "google".
    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null },

    // Password policy support:
    //  - previousPasswords: hashes of old passwords, so they can't be reused
    //  - passwordChangedAt: when the password was last set (for 90-day expiry)
    previousPasswords: { type: [String], default: [] },
    passwordChangedAt: { type: Date, default: Date.now },

    // Account lockout (brute-force defence at the account level):
    //  - failedLoginAttempts: consecutive wrong passwords
    //  - lockUntil: if set and in the future, login is blocked
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },

    // Optional profile detail, stored AES-encrypted at rest (see lib/crypto.js).
    phoneEncrypted: { type: String, default: "" },

    // Role-based access control: normal visitors are "user"; only "admin"
    // can manage tours. Promote an account with: npm run make-admin -- <email>
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Two-factor one-time code (we store a HASH of the code, not the code).
    otpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },

    // Password-reset code (same idea: hash only, short expiry, few attempts).
    resetHash: { type: String, default: null },
    resetExpiresAt: { type: Date, default: null },
    resetAttempts: { type: Number, default: 0 },

    // Tours this user bookmarked (references into the tours collection).
    savedTours: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tour" }],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
