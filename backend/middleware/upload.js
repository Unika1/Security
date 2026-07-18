import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";

// Handles tour image uploads from the admin dashboard.
// Rules:
// only JPG, PNG or WebP files are allowed (checked by MIME type),
// the max size is 2 MB, and we give each file a random name so a
// bad filename like "photo.jpg.exe" cannot cause problems.

export const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Allowed image types and the extension we save them with.
const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename(req, file, cb) {
    // Build a safe file name: a random id plus the correct extension.
    const randomName = crypto.randomUUID();
    const extension = ALLOWED_TYPES[file.mimetype];
    cb(null, randomName + extension);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter(req, file, cb) {
    if (ALLOWED_TYPES[file.mimetype]) return cb(null, true);
    cb(new Error("Only JPG, PNG or WebP images are allowed."));
  },
}).single("image"); // the form field must be called "image"
