import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Tour from "../models/Tour.js";
import { requireCsrf } from "../middleware/csrf.js";
import { requireAuth } from "../lib/auth.js";

const router = express.Router();

/*
  Saved (bookmarked) tours. Every route needs a logged-in user, and each
  user can only ever see or change their OWN list — the user id comes from
  the verified login cookie (req.userId), never from the request body.
*/

// GET /api/saved -> the logged-in user's saved tours, newest first
router.get("/", requireAuth, async (req, res) => {
  try {
    // populate() swaps the stored tour ids for the full tour documents.
    const user = await User.findById(req.userId).populate("savedTours");
    return res.json({ tours: (user?.savedTours || []).reverse() });
  } catch (err) {
    console.error("List saved error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

// POST /api/saved/:tourId -> save a tour
router.post("/:tourId", requireCsrf, requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.tourId)) {
      return res.status(400).json({ error: "Invalid tour id." });
    }
    const tour = await Tour.findById(req.params.tourId);
    if (!tour) return res.status(404).json({ error: "Tour not found." });

    // $addToSet adds the id only if it isn't in the list yet (no duplicates).
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { savedTours: tour._id },
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Save tour error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

// DELETE /api/saved/:tourId -> remove a tour from the saved list
router.delete("/:tourId", requireCsrf, requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.tourId)) {
      return res.status(400).json({ error: "Invalid tour id." });
    }
    // $pull removes the id from the list (fine if it wasn't there).
    await User.findByIdAndUpdate(req.userId, {
      $pull: { savedTours: req.params.tourId },
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Unsave tour error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

export default router;
