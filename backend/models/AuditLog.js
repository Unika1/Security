import mongoose from "mongoose";

// One record for each security action like login, logout or password reset.
// This is used to keep track of activity. We do not store passwords or
// OTP codes here, only what happened, when, and from which IP.
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
