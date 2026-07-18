"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getJson } from "@/lib/clientApi";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ask the backend who is logged in, then show the dashboard or landing page.
  useEffect(() => {
    getJson("/api/auth/me")
      .then(({ data }) => setUser(data?.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-stone-500">Loading…</div>
    );
  }

  return user ? <Dashboard user={user} /> : <LandingPage />;
}

// ---------------------------------------------------------------------------
// Dashboard, shown when the user IS logged in
// ---------------------------------------------------------------------------
function Dashboard({ user }) {
  const cards = [
    { href: "/tours", title: "Browse Tours", text: "Explore cultural and heritage tours across Nepal." },
    { href: "/saved", title: "Saved Tours", text: "View the tours you have saved for later." },
    { href: "/profile", title: "Your Profile", text: "Manage your account and security settings." },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">
        Welcome back, {user.name}
      </h1>
      <p className="mt-2 text-stone-600">
        Here is your CityMate dashboard. Where would you like to go?
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-stone-900">{card.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{card.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Landing page - shown when the user is NOT logged in
// ---------------------------------------------------------------------------
function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="mb-3 inline-block rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-light">
            Cultural &amp; Heritage Tours
          </p>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Explore the living heritage of{" "}
            <span className="text-brand-light">Nepal</span> with CityMate
          </h1>
          <p className="mt-4 max-w-xl text-lg text-stone-300">
            Browse curated city tours, follow ready-made itineraries, and
            discover the temples, squares, and stories that make Nepal
            unforgettable.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/tours"
              className="rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
            >
              Browse Tours
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-stone-900">
          Sign in to explore tours
        </h2>
        <p className="mt-2 max-w-xl text-stone-600">
          Create a free account to browse cultural and heritage tours across
          Nepal, view full details, and save your favourites for later.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-stone-300 px-6 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            Log in
          </Link>
        </div>
      </section>
    </div>
  );
}
