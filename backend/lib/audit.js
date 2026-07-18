import AuditLog from "../models/AuditLog.js";

// Save one security event to the log. Called from the routes after
// actions like login or password reset. If saving the log fails we just
// print it to the console so the user's action is not affected.
export async function logEvent(req, action, extra = {}) {
  try {
    await AuditLog.create({
      action,
      email: extra.email || "",
      userId: extra.userId || null,
      ip: req.ip || req.socket?.remoteAddress || "",
      userAgent: req.get?.("user-agent") || "",
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
}
