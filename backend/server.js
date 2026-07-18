import "dotenv/config";
import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import connectToDatabase from "./config/db.js";
import authRoutes from "./routes/auth.js";
import tourRoutes from "./routes/tours.js";
import savedRoutes from "./routes/saved.js";
import adminRoutes from "./routes/admin.js";
import { issueCsrfToken } from "./middleware/csrf.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

//Security and setup middleware

// helmet adds safe HTTP headers like Content-Security-Policy and HSTS.
app.use(helmet());

// Decide if a website is allowed to call this API.
// We allow our own frontend, plus localhost and local IPs during development.
function isAllowedOrigin(origin) {
  // Requests with no origin (like tools or the Next.js server) are allowed.
  if (!origin) return true;

  // Our main frontend address is always allowed.
  if (origin === CLIENT_ORIGIN) return true;

  // In development also allow localhost, 127.0.0.1 and local network IPs.
  const devPattern = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/;
  return devPattern.test(origin);
}

// Turn on CORS using the check above.
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true); // allowed
      } else {
        callback(new Error("Not allowed by CORS")); // blocked
      }
    },
    credentials: true, // let the browser send cookies
  })
);

app.use(express.json()); // read JSON from the request body
app.use(cookieParser()); // read cookies from the request
app.use(issueCsrfToken); // give every visitor a CSRF token cookie

// ---- Routes ----
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/admin", adminRoutes);

// Serve the uploaded tour pictures at /api/uploads/...
app.use("/api/uploads", express.static(path.resolve("uploads")));

// ---- Connect to the database, then start the server ----
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CityMate backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start backend:", err);
    process.exit(1);
  });
