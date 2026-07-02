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

    // Two-factor one-time code (we store a HASH of the code, not the code).
    otpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
