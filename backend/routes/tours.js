import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Tour from "../models/Tour.js";
import { validate, tourSchema } from "../lib/validation.js";
import { requireCsrf } from "../middleware/csrf.js";
import { requireAuth, requireAdmin } from "../lib/auth.js";
import { uploadImage, UPLOAD_DIR } from "../middleware/upload.js";

const router = express.Router();

// GET /api/tours -> list all tours (public — anyone can browse)
router.get("/", async (req, res) => {
  try {
    const tours = await Tour.find().sort({ createdAt: -1 });
    return res.json({ tours });
  } catch (err) {
    console.error("List tours error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

// POST /api/tours -> create a tour (admin only)
// Middleware runs left to right: CSRF check, then login check, then role check.
router.post("/", requireCsrf, requireAuth, requireAdmin, async (req, res) => {
  try {
    const check = validate(tourSchema, req.body);
    if (!check.ok) return res.status(400).json({ error: check.error });

    const tour = await Tour.create(check.data);
    return res.status(201).json({ tour });
  } catch (err) {
    console.error("Create tour error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

// POST /api/tours/image -> upload a tour picture (admin only).
// Returns the URL to put in the tour's imageUrl field.
router.post("/image", requireCsrf, requireAuth, requireAdmin, (req, res) => {
  // uploadImage checks the type and size; any problem comes back as `err`.
  uploadImage(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "The image is too large (2 MB maximum)."
          : err.message;
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Please choose an image file." });
    }
    return res.status(201).json({ url: `/api/uploads/${req.file.filename}` });
  });
});

// DELETE /api/tours/:id -> remove a tour (admin only)
router.delete("/:id", requireCsrf, requireAuth, requireAdmin, async (req, res) => {
  try {
    // Reject ids that aren't even the right shape before querying.
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid tour id." });
    }

    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) return res.status(404).json({ error: "Tour not found." });

    // If the tour had an uploaded picture, delete the file too so the
    // uploads folder doesn't collect orphans. path.basename strips any
    // folder tricks; errors are ignored (the file may already be gone).
    if (tour.imageUrl?.startsWith("/api/uploads/")) {
      const filename = path.basename(tour.imageUrl);
      fs.unlink(path.join(UPLOAD_DIR, filename), () => {});
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Delete tour error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

export default router;
