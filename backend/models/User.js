import mongoose from "mongoose";

/*
  A "model" describes the shape of a document stored in MongoDB.
  This User model is how every CityMate account is saved.

  We never store the raw password — only a bcrypt hash in `passwordHash`.
  The otp* fields support two-factor login (a 6-digit code).
*/
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
    passwordHash: { type: String, required: true },

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
