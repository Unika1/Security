"use client";

import { CSRF_COOKIE, CSRF_HEADER } from "./csrf";

// The frontend calls its OWN address (same origin). Next.js forwards /api/*
// to the Express backend (see next.config.mjs "rewrites"). So we use plain
// relative paths like "/api/auth/login" — no hostname needed.
const API_URL = "";

// Read a cookie value by name from the browser's document.cookie string.
function readCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/*
  postJson — send JSON to the backend.
  - credentials: "include" sends/receives the login + CSRF cookies.
  - We attach the CSRF token (read from the cookie) in the x-csrf-token header.
  Returns { ok, status, data }.
*/
export async function postJson(path, body) {
  const csrfToken = readCookie(CSRF_COOKIE) || "";

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      [CSRF_HEADER]: csrfToken,
    },
    body: JSON.stringify(body || {}),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

// getJson — read data from the backend (e.g. the current user).
export async function getJson(path) {
  const res = await fetch(`${API_URL}${path}`, { credentials: "include" });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}
