"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getJson, postJson, postFile, deleteJson } from "@/lib/clientApi";

// The five cities tours can belong to (must match the backend's list).
const CITIES = ["Kathmandu", "Bhaktapur", "Patan", "Pokhara", "Lumbini"];

export default function AdminPage() {
  // Who is looking at this page? "loading" until the server answers.
  const [me, setMe] = useState("loading");

  // The list of existing tours shown under the form.
  const [tours, setTours] = useState([]);

  // Form fields for a new tour.
  const [title, setTitle] = useState("");
  const [city, setCity] = useState(CITIES[0]);
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [price, setPrice] = useState("");
  const [highlights, setHighlights] = useState("");
  const [imageFile, setImageFile] = useState(null); // the chosen picture (or null)

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // On first load: find out who is logged in, and fetch the tours.
  useEffect(() => {
    getJson("/api/auth/me")
      .then(({ data }) => setMe(data?.user || null))
      .catch(() => setMe(null));
    refreshTours();
  }, []);

  async function refreshTours() {
    const { data } = await getJson("/api/tours");
    setTours(data?.tours || []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    // Our own checks (the browser's default popups are turned off with
    // noValidate below, so all messages use the same styled boxes).
    if (!title.trim() || !description.trim() || durationHours === "" || price === "") {
      setError("Please fill in the title, description, duration and price.");
      return;
    }
    if (Number(durationHours) < 1) {
      setError("Duration must be at least 1 hour.");
      return;
    }
    if (Number(price) < 0) {
      setError("Price cannot be negative.");
      return;
    }

    setSaving(true);

    try {
      // If a picture was chosen, upload it first — the server sends back the
      // URL we then store on the tour.
      let imageUrl = "";
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const upload = await postFile("/api/tours/image", formData);
        if (!upload.ok) {
          setError(upload.data?.error || "Could not upload the image.");
          return;
        }
        imageUrl = upload.data.url;
      }

      const { ok, data } = await postJson("/api/tours", {
        title,
        city,
        description,
        durationHours,
        price,
        imageUrl,
        // Turn "Durbar Square, Local lunch" into ["Durbar Square", "Local lunch"].
        highlights: highlights
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean),
      });

      if (!ok) {
        setError(data?.error || "Could not save the tour.");
        return;
      }

      setSuccess(`"${data.tour.title}" was added.`);
      setTitle("");
      setDescription("");
      setDurationHours("");
      setPrice("");
      setHighlights("");
      setImageFile(null);
      event.target.reset(); // clears the file picker (it isn't tied to state)
      refreshTours();
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tour) {
    // window.confirm shows a small OK/Cancel popup before deleting.
    if (!window.confirm(`Delete "${tour.title}"? This cannot be undone.`)) return;

    const { ok, data } = await deleteJson(`/api/tours/${tour._id}`);
    if (!ok) {
      setError(data?.error || "Could not delete the tour.");
      return;
    }
    refreshTours();
  }

  // --- Access control (the real check is on the server; this is just UI) ---

  if (me === "loading") {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-stone-600">Loading…</p>;
  }

  if (!me || me.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold text-stone-900">Admin dashboard</h1>
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">
          This page is for administrators only.
          {!me && (
            <>
              {" "}
              Please{" "}
              <Link href="/login" className="font-semibold underline">
                log in
              </Link>{" "}
              first.
            </>
          )}
        </p>
      </div>
    );
  }

  // --- The dashboard itself (only admins reach this point) ---

  const inputClass =
    "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">Admin dashboard</h1>
      <p className="mt-2 text-stone-600">
        Add new tours here — they appear on the Tours page right away.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-stone-700">
            Tour title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Kathmandu Durbar Square Walk"
            className={inputClass}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-stone-700">
              City
            </label>
            <select
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="durationHours"
              className="block text-sm font-medium text-stone-700"
            >
              Duration (hours)
            </label>
            <input
              id="durationHours"
              type="number"
              required
              min={1}
              max={72}
              value={durationHours}
              // strip any minus sign, so a negative can't even be typed
              onChange={(e) => setDurationHours(e.target.value.replace("-", ""))}
              placeholder="3"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-stone-700">
              Price (NPR)
            </label>
            <input
              id="price"
              type="number"
              required
              min={0}
              value={price}
              // strip any minus sign, so a negative can't even be typed
              onChange={(e) => setPrice(e.target.value.replace("-", ""))}
              placeholder="1500"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-stone-700"
          >
            Description
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will visitors see and do on this tour?"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="highlights"
            className="block text-sm font-medium text-stone-700"
          >
            Highlights <span className="font-normal text-stone-500">(comma separated, optional)</span>
          </label>
          <input
            id="highlights"
            type="text"
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            placeholder="Durbar Square, Kumari Ghar, Local street food"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-stone-700">
            Picture <span className="font-normal text-stone-500">(JPG/PNG/WebP, max 2 MB, optional)</span>
          </label>
          <input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files[0] || null)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200"
          />
          {imageFile && (
            // URL.createObjectURL shows the picture before it's uploaded.
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Preview of the chosen picture"
              className="mt-3 h-32 w-full rounded-lg object-cover"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add tour"}
        </button>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        )}
      </form>

      <h2 className="mt-12 text-xl font-bold text-stone-900">
        Existing tours ({tours.length})
      </h2>

      {tours.length === 0 ? (
        <p className="mt-3 text-stone-600">No tours yet — add the first one above.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {tours.map((tour) => (
            <li
              key={tour._id}
              className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {tour.imageUrl && (
                  <img
                    src={tour.imageUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-stone-900">{tour.title}</p>
                  <p className="text-sm text-stone-600">
                    {tour.city} · {tour.durationHours}h · NPR {tour.price}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(tour)}
                className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
