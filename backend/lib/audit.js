import AuditLog from "../models/AuditLog.js";

/*
  Record one security event. Called from routes after notable actions.
  Never throws into the request flow — if logging fails, we log to the console
  but do not break the user's action.
*/
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
