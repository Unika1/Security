"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getJson } from "@/lib/clientApi";

export default function ToursPage() {
  const [tours, setTours] = useState(null); // null = still loading

  useEffect(() => {
    getJson("/api/tours")
      .then(({ data }) => setTours(data?.tours || []))
      .catch(() => setTours([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">Tours</h1>
      <p className="mt-2 text-stone-600">
        Browse cultural &amp; heritage tours across Nepal.
      </p>

      {tours === null ? (
        <p className="mt-8 text-stone-600">Loading tours…</p>
      ) : tours.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-stone-600">
          No tours available yet — check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <Link
              key={tour._id}
              href={`/tours/${tour._id}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
            >
              {tour.imageUrl && (
                <img
                  src={tour.imageUrl}
                  alt={tour.title}
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-5">
              <span className="self-start rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                {tour.city}
              </span>
              <h2 className="mt-3 text-lg font-bold text-stone-900">{tour.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-stone-600">
                {tour.description}
              </p>

              {tour.highlights?.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {tour.highlights.map((h) => (
                    <li
                      key={h}
                      className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600"
                    >
                      {h}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-sm">
                <span className="text-stone-600">{tour.durationHours} hours</span>
                <span className="font-bold text-stone-900">
                  {tour.price === 0 ? "Free" : `NPR ${tour.price}`}
                </span>
              </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
