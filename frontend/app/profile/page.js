"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getJson } from "@/lib/clientApi";
import LogoutButton from "../components/LogoutButton";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ask the backend who is logged in. If nobody, send them to the login page.
  useEffect(() => {
    getJson("/api/auth/me")
      .then(({ data }) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-stone-500">Loading…</div>
    );
  }
  if (!user) return null; // we're redirecting

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-stone-900">Profile</h1>
        <LogoutButton />
      </div>

      <div className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm text-stone-500">Name</p>
          <p className="font-medium text-stone-900">{user.name}</p>
        </div>
        <div>
          <p className="text-sm text-stone-500">Email</p>
          <p className="font-medium text-stone-900">{user.email}</p>
        </div>
      </div>

      <p className="mt-6 text-sm text-stone-500">
        Saved tours will appear here in upcoming steps.
      </p>
    </div>
  );
}
