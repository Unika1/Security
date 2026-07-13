import express from "express";
import AuditLog from "../models/AuditLog.js";
import { requireCsrf } from "../middleware/csrf.js";
import { requireAuth, requireAdmin } from "../lib/auth.js";

const router = express.Router();

// GET /api/admin/logs -> recent audit-trail entries (admin only).
// Supports monitoring, auditing and incident response.
router.get("/logs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
    return res.json({ logs });
  } catch (err) {
    console.error("List logs error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

export default router;
