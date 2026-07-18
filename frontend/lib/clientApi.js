"use client";

import { CSRF_COOKIE, CSRF_HEADER } from "./csrf";

// The frontend calls its own address. Next.js forwards /api/* to the
// Express backend (see the rewrites in next.config.mjs), so we can use
// simple paths like "/api/auth/login" with no hostname.
const API_URL = "";

// Read a cookie value by name from the browser's document.cookie string.
function readCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

// Send JSON to the backend with a POST request.
// credentials: "include" sends the login and CSRF cookies.
// We read the CSRF token from the cookie and send it in a header.
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

// Update something on the backend with a PUT request. Same as postJson
// but uses PUT, which is the usual method for updating an item.
export async function putJson(path, body) {
  const csrfToken = readCookie(CSRF_COOKIE) || "";

  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
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

// Upload a file using FormData. We send the CSRF header but not a
// Content-Type, because the browser sets the right one for us.
export async function postFile(path, formData) {
  const csrfToken = readCookie(CSRF_COOKIE) || "";

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { [CSRF_HEADER]: csrfToken },
    body: formData,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

// Ask the backend to delete something. This changes data so it also
// needs the CSRF token, like postJson.
export async function deleteJson(path) {
  const csrfToken = readCookie(CSRF_COOKIE) || "";

  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: { [CSRF_HEADER]: csrfToken },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

// Read data from the backend, for example the current user.
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
