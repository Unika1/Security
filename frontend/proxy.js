import { NextResponse } from "next/server";

/*
  Next.js 16 renamed "middleware" to "proxy" (same idea: code that runs before
  a request is completed). We use it to attach a Content-Security-Policy (CSP)
  to every page response.

  CSP is one of the strongest defenses against cross-site scripting (XSS):
  it tells the browser exactly which sources of scripts/styles/etc. are
  allowed, so an injected <script> from an attacker simply won't run.

  We use a per-request "nonce" (a random one-time token). Next.js automatically
  stamps this nonce onto its own <script> tags, and the browser only executes
  scripts carrying the matching nonce.
*/

export function proxy(request) {
  // A fresh, unguessable token for this single request.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  // In development, React uses eval() for better error overlays, so we must
  // allow 'unsafe-eval'. This is NOT included in production.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' blob: data: https:;
    font-src 'self';
    connect-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isDev ? "" : "upgrade-insecure-requests;"}
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  // Pass the nonce to the rendering layer via a request header so Next.js can
  // read it and apply it to framework scripts automatically.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Also send the CSP on the response so the browser enforces it.
  response.headers.set("Content-Security-Policy", cspHeader);

  // NOTE: the CSRF token cookie is now issued by the Express backend, not here.
  return response;
}

export const config = {
  matcher: [
    /*
      Run on all page routes EXCEPT API routes, Next.js static assets, the
      image optimizer, and the favicon — those don't need a page-level CSP.
      Also skip link prefetch requests.
    */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
