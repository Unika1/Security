"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Map,
  Heart,
  User,
  Landmark,
  Building2,
  Palette,
  Mountain,
  Sun,
  ShieldCheck,
  Compass,
} from "lucide-react";
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
    { href: "/tours", Icon: Map, title: "Browse Tours", text: "Explore cultural and heritage tours across Nepal." },
    { href: "/saved", Icon: Heart, title: "Saved Tours", text: "View the tours you have saved for later." },
    { href: "/profile", Icon: User, title: "Your Profile", text: "Manage your account and security settings." },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="rounded-3xl bg-gradient-to-r from-ink to-brand-dark px-8 py-10 text-white shadow-sm">
        <p className="text-sm font-medium text-brand-light">CityMate Dashboard</p>
        <h1 className="mt-1 text-3xl font-bold">Welcome back, {user.name}</h1>
        <p className="mt-2 text-stone-300">Where would you like to go today?</p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-lg"
          >
            <span className="inline-flex rounded-xl bg-brand/10 p-3 text-brand">
              <card.Icon size={24} strokeWidth={2} />
            </span>
            <h2 className="mt-3 text-lg font-semibold text-stone-900 group-hover:text-brand">
              {card.title}
            </h2>
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
  const cities = [
    { Icon: Landmark, name: "Kathmandu" },
    { Icon: Building2, name: "Bhaktapur" },
    { Icon: Palette, name: "Patan" },
    { Icon: Mountain, name: "Pokhara" },
    { Icon: Sun, name: "Lumbini" },
  ];

  const features = [
    { Icon: ShieldCheck, title: "Secure accounts", text: "Login protected with two-factor email codes and strong passwords." },
    { Icon: Compass, title: "Curated tours", text: "Hand-picked cultural and heritage tours across Nepal." },
    { Icon: Heart, title: "Save favourites", text: "Bookmark the tours you love and find them again anytime." },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ink via-ink to-brand-dark text-white">
        {/* soft decorative glow circles */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-brand-light/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <p className="mb-4 inline-block rounded-full bg-brand/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-light">
            Cultural &amp; Heritage Tours · Nepal
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">
            Explore the living heritage of{" "}
            <span className="text-brand-light">Nepal</span> with CityMate
          </h1>
          <p className="mt-5 max-w-xl text-lg text-stone-300">
            Browse curated city tours, discover the temples, squares, and
            stories that make Nepal unforgettable, and save your favourites.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-full bg-brand px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              Log in
            </Link>
          </div>

          {/* stat row */}
          <div className="mt-14 flex flex-wrap gap-x-12 gap-y-6">
            <Stat number="5" label="Heritage cities" />
            <Stat number="2FA" label="Secure login" />
            <Stat number="100%" label="Free to browse" />
          </div>
        </div>
      </section>

      {/* Cities showcase */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-stone-900">
          Discover Nepal&apos;s heritage cities
        </h2>
        <p className="mt-2 text-center text-stone-600">
          From ancient durbar squares to lakeside views and sacred birthplaces.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {cities.map((c) => (
            <div
              key={c.name}
              className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white px-4 py-6 shadow-sm transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-md"
            >
              <span className="inline-flex rounded-full bg-brand/10 p-3 text-brand">
                <c.Icon size={26} strokeWidth={1.75} />
              </span>
              <span className="mt-3 font-semibold text-stone-800">{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-stone-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-stone-900">
            Why CityMate
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <span className="inline-flex rounded-xl bg-brand/10 p-3 text-brand">
                  <f.Icon size={24} strokeWidth={2} />
                </span>
                <h3 className="mt-3 text-lg font-semibold text-stone-900">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm text-stone-600">{f.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="rounded-full bg-brand px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
            >
              Create your free account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// A small number + label used in the hero stat row.
function Stat({ number, label }) {
  return (
    <div>
      <p className="text-3xl font-bold text-white">{number}</p>
      <p className="mt-1 text-sm text-stone-400">{label}</p>
    </div>
  );
}
