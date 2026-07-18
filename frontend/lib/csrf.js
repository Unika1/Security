// Shared names for the CSRF cookie and header used by the frontend.
// The backend issues and checks the token (see backend middleware/csrf.js).

export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

// Create a random token (used by the proxy to seed the cookie).
export function generateCsrfToken() {
  return crypto.randomUUID();
}
