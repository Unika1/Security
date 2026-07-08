import "dotenv/config";
import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import connectToDatabase from "./config/db.js";
import authRoutes from "./routes/auth.js";
import tourRoutes from "./routes/tours.js";
import { issueCsrfToken } from "./middleware/csrf.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

// --- Security & parsing middleware (order matters) ---

// helmet sets safe HTTP headers (incl. a Content-Security-Policy, HSTS, etc.).
app.use(helmet());

// Allow our frontend to call this API (and send cookies). In development we
// accept localhost, 127.0.0.1, and LAN IPs (192.168.x.x) on any port, so the
// site works whether you open it via localhost or the network address.
const devOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (no origin) and any matching dev origin.
      if (!origin || origin === CLIENT_ORIGIN || devOriginPattern.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json()); // parse JSON request bodies
app.use(cookieParser()); // read cookies from requests
app.use(issueCsrfToken); // make sure every visitor has a CSRF token cookie

// --- Routes ---
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/tours", tourRoutes);

// Serve uploaded tour pictures (the frontend shows them via /api/uploads/...).
app.use("/api/uploads", express.static(path.resolve("uploads")));

// --- Start the server after connecting to the database ---
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
