"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getJson, putJson } from "@/lib/clientApi";
import LogoutButton from "../components/LogoutButton";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable phone number (stored AES-encrypted on the server).
  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState("");
  const [phoneErr, setPhoneErr] = useState("");

  // Ask the backend who is logged in. If nobody, send them to the login page.
  useEffect(() => {
    getJson("/api/auth/me")
      .then(({ data }) => {
        if (data?.user) {
          setUser(data.user);
          setPhone(data.user.phone || "");
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSavePhone(event) {
    event.preventDefault();
    setPhoneErr("");
    setPhoneMsg("");
    setSavingPhone(true);
    try {
      const { ok, data } = await putJson("/api/auth/profile", { phone });
      if (!ok) {
        setPhoneErr(data?.error || "Could not save.");
        return;
      }
      setPhoneMsg("Phone number saved.");
    } catch {
      setPhoneErr("Could not reach the server.");
    } finally {
      setSavingPhone(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-stone-500">Loading…</div>
    );
  }
  if (!user) return null; // we're redirecting

  const isAdmin = user.role === "admin";

  // A friendly version of the account creation date, like "July 2026".
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-stone-900">Profile</h1>
        <LogoutButton />
      </div>

      {/* Profile card: dark banner with the avatar overlapping onto the body */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900" />

        <div className="px-6 pb-6">
          {/* Avatar: a circle with the first letter of the name */}
          <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-brand text-3xl font-bold text-white shadow">
            {user.name?.charAt(0).toUpperCase() || "?"}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-stone-900">{user.name}</h2>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                isAdmin
                  ? "bg-brand/10 text-brand"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {isAdmin ? "Admin" : "Member"}
            </span>
          </div>

          <dl className="mt-5 grid gap-4 border-t border-stone-100 pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-stone-500">Email</dt>
              <dd className="mt-0.5 font-medium text-stone-900">{user.email}</dd>
            </div>
            {memberSince && (
              <div>
                <dt className="text-sm text-stone-500">Member since</dt>
                <dd className="mt-0.5 font-medium text-stone-900">{memberSince}</dd>
              </div>
            )}
          </dl>

          {/* Editable phone number. It is stored AES encrypted on the server. */}
          <form onSubmit={handleSavePhone} className="mt-5 border-t border-stone-100 pt-5">
            <label htmlFor="phone" className="block text-sm font-medium text-stone-700">
              Phone number
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977 98XXXXXXXX"
                className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
              <button
                type="submit"
                disabled={savingPhone}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {savingPhone ? "Saving…" : "Save"}
              </button>
            </div>
            {phoneMsg && <p className="mt-2 text-sm text-green-600">{phoneMsg}</p>}
            {phoneErr && <p className="mt-2 text-sm text-red-600">{phoneErr}</p>}
          </form>
        </div>
      </div>

      {/* Quick links to the rest of the site */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <QuickLink
          href="/tours"
          title="Browse tours"
          text="Explore cultural & heritage tours across Nepal."
        />
        <QuickLink
          href="/saved"
          title="Saved tours"
          text="Tours you bookmark will be collected here."
        />
        {isAdmin && (
          <QuickLink
            href="/admin"
            title="Admin dashboard"
            text="Add or remove the tours shown on the site."
          />
        )}
      </div>
    </div>
  );
}

// A small card that links to another page.
function QuickLink({ href, title, text }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-brand/40 hover:shadow"
    >
      <p className="font-semibold text-stone-900 group-hover:text-brand">
        {title} <span aria-hidden>→</span>
      </p>
      <p className="mt-1 text-sm text-stone-600">{text}</p>
    </Link>
  );
}
