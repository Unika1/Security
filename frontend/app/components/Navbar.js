"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { postJson, getJson } from "@/lib/clientApi";

// The four main navigation destinations from the design spec.
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tours", label: "Tours" },
  { href: "/saved", label: "Saved" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Track whether someone is logged in, so we can show Login vs Log out.
  const [user, setUser] = useState(null);

  // Ask the server who is logged in. We re-check whenever the page changes
  // (e.g. right after logging in or out) so the button stays correct.
  useEffect(() => {
    getJson("/api/auth/me")
      .then(({ data }) => setUser(data?.user || null))
      .catch(() => setUser(null));
  }, [pathname]);

  async function handleLogout() {
    await postJson("/api/auth/logout");
    setUser(null);
    router.push("/");
    router.refresh();
  }

  // A link is "active" when it exactly matches the current path, or (for
  // section links like /tours) when the current path is inside that section.
  function isActive(href) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand">
          <span className="text-2xl">🏯</span>
          <span className="text-xl tracking-tight">CityMate</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="flex items-center gap-1 sm:gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                    isActive(link.href)
                      ? "bg-brand text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            {/* The Admin link only appears for admin accounts. (The server
                still checks the role on every admin request — hiding the link
                is just tidier, not the security.) */}
            {user?.role === "admin" && (
              <li>
                <Link
                  href="/admin"
                  aria-current={isActive("/admin") ? "page" : undefined}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                    isActive("/admin")
                      ? "bg-brand text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  Admin
                </Link>
              </li>
            )}
          </ul>

          {/* Show "Log out" when signed in, otherwise "Login". */}
          {user ? (
            <button
              onClick={handleLogout}
              className="ml-1 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 sm:ml-2"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white sm:ml-2"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
