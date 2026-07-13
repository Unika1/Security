import mongoose from "mongoose";

/*
  An audit trail: one record per security-relevant action (login, logout,
  password reset, admin tour changes, etc.). It supports monitoring and
  incident response. We deliberately store NO sensitive data — no passwords,
  no OTP codes — only who did what, when, and from where.
*/
const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g. "login_success"
    email: { type: String, default: "" }, // the account involved, if known
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true } // createdAt is the event time
);

export default mongoose.model("AuditLog", auditLogSchema);
