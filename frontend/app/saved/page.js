"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getJson, deleteJson } from "@/lib/clientApi";

export default function SavedPage() {
  const router = useRouter();
  const [tours, setTours] = useState(null); // null = still loading

  // Load the logged-in user's saved tours; send visitors to the login page.
  useEffect(() => {
    getJson("/api/saved").then(({ ok, status, data }) => {
      if (!ok && status === 401) {
        router.replace("/login");
        return;
      }
      setTours(data?.tours || []);
    });
  }, [router]);

  async function handleRemove(tour) {
    const { ok } = await deleteJson(`/api/saved/${tour._id}`);
    if (ok) setTours(tours.filter((t) => t._id !== tour._id));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">Saved tours</h1>
      <p className="mt-2 text-stone-600">Tours you bookmarked, all in one place.</p>

      {tours === null ? (
        <p className="mt-8 text-stone-600">Loading…</p>
      ) : tours.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-stone-600">
          Nothing saved yet — find something you like on the{" "}
          <Link href="/tours" className="font-semibold text-brand hover:underline">
            Tours page
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <article
              key={tour._id}
              className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
            >
              <Link href={`/tours/${tour._id}`}>
                {tour.imageUrl && (
                  <img
                    src={tour.imageUrl}
                    alt={tour.title}
                    className="h-40 w-full object-cover"
                  />
                )}
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <span className="self-start rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                  {tour.city}
                </span>
                <Link href={`/tours/${tour._id}`}>
                  <h2 className="mt-3 text-lg font-bold text-stone-900 hover:text-brand">
                    {tour.title}
                  </h2>
                </Link>
                <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                  {tour.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-sm">
                  <span className="text-stone-600">
                    {tour.durationHours}h ·{" "}
                    {tour.price === 0 ? "Free" : `NPR ${tour.price}`}
                  </span>
                  <button
                    onClick={() => handleRemove(tour)}
                    className="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
