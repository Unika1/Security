"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getJson, postJson, deleteJson } from "@/lib/clientApi";

export default function TourDetailPage() {
  const { id } = useParams(); // the tour id from the URL (/tours/<id>)

  const [tour, setTour] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState(null); // logged-in user (or null)
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false); // true while save/unsave runs

  useEffect(() => {
    async function load() {
      // 1. the tour itself
      const t = await getJson(`/api/tours/${id}`);
      if (!t.ok) {
        setError(t.data?.error || "Tour not found.");
        setLoading(false);
        return;
      }
      setTour(t.data.tour);

      // 2. who is looking, and did they already save this tour?
      const m = await getJson("/api/auth/me");
      const user = m.data?.user || null;
      setMe(user);
      if (user) {
        const s = await getJson("/api/saved");
        setSaved((s.data?.tours || []).some((savedTour) => savedTour._id === id));
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function toggleSave() {
    setBusy(true);
    const res = saved
      ? await deleteJson(`/api/saved/${id}`)
      : await postJson(`/api/saved/${id}`);
    if (res.ok) setSaved(!saved);
    setBusy(false);
  }

  if (loading) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-stone-600">Loading…</p>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</p>
        <Link href="/tours" className="mt-4 inline-block text-brand hover:underline">
          ← Back to tours
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/tours" className="text-sm text-stone-500 hover:text-brand hover:underline">
        ← Back to tours
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {tour.imageUrl && (
          <img
            src={tour.imageUrl}
            alt={tour.title}
            className="h-64 w-full object-cover"
          />
        )}

        <div className="p-6">
          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            {tour.city}
          </span>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-bold text-stone-900">{tour.title}</h1>

            {/* Save needs an account; the server checks this too. */}
            {me ? (
              <button
                onClick={toggleSave}
                disabled={busy}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                  saved
                    ? "bg-brand text-white hover:bg-brand-dark"
                    : "border border-brand text-brand hover:bg-brand hover:text-white"
                }`}
              >
                {busy ? "…" : saved ? "Saved ✓" : "Save tour"}
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100"
              >
                Log in to save
              </Link>
            )}
          </div>

          <p className="mt-2 flex gap-4 text-sm text-stone-600">
            <span>{tour.durationHours} hours</span>
            <span className="font-semibold text-stone-900">
              {tour.price === 0 ? "Free" : `NPR ${tour.price}`}
            </span>
          </p>

          <p className="mt-5 whitespace-pre-line leading-relaxed text-stone-700">
            {tour.description}
          </p>

          {tour.highlights?.length > 0 && (
            <div className="mt-6 border-t border-stone-100 pt-5">
              <h2 className="text-sm font-semibold text-stone-900">Highlights</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {tour.highlights.map((h) => (
                  <li
                    key={h}
                    className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
