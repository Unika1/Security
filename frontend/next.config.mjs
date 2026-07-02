/** @type {import('next').NextConfig} */

// Are we running the local dev server (npm run dev)?
const isDev = process.env.NODE_ENV === "development";

// Security headers applied to every response (pages AND static assets).
// The Content-Security-Policy itself is set per-request in proxy.js because
// it needs a fresh nonce each time.
const securityHeaders = [
  // Block the site from being embedded in iframes (anti-clickjacking).
  // CSP frame-ancestors covers modern browsers; this covers older ones.
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from guessing/overriding declared content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs to other sites in the Referer header.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable powerful browser features we don't use.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// HSTS forces browsers to ONLY use HTTPS. That's great in production, but on
// your local machine there is no HTTPS, so it breaks the dev site
// (ERR_SSL_PROTOCOL_ERROR). So we only add it when NOT in development.
if (!isDev) {
  securityHeaders.unshift({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

// Where the Express backend actually runs (server-side only).
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig = {
  // Allow the dev server's live-reload (HMR) to work when the site is opened
  // via the local network IP, not just "localhost". Avoids WebSocket errors.
  allowedDevOrigins: ["192.168.198.1"],

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  // Forward any request to /api/* to the Express backend. The browser only
  // ever talks to THIS app (one address), and Next.js relays the call to the
  // backend behind the scenes. This removes all cross-origin (CORS), cookie,
  // localhost-vs-IP, and HTTPS mixed-content problems.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
