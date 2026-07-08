import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";

/*
  Image upload handling (used by the admin dashboard for tour pictures).

  Security rules applied here:
  - Only real image types are accepted (JPG, PNG, WebP) — checked by MIME type.
  - Maximum size 2 MB, so nobody can fill the disk.
  - We NEVER use the uploaded filename. Files get a random name plus an
    extension from OUR list, which blocks tricks like "photo.jpg.exe" or
    path characters in the name.
*/

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
    cb(null, crypto.randomUUID() + ALLOWED_TYPES[file.mimetype]);
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
