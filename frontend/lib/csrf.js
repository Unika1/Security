/*
  CSRF (Cross-Site Request Forgery) — shared constants and token generator.

  This file is SAFE to import from both client and server code, because it
  does NOT import "next/headers". The server-only check (which reads cookies)
  lives separately in lib/csrf-server.js.

  See lib/csrf-server.js for the full explanation of how the defense works.
*/

export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

// Create a random token (used by the proxy to seed the cookie).
export function generateCsrfToken() {
  return crypto.randomUUID();
}
