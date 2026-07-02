"use client";

import { useRouter } from "next/navigation";
import { postJson } from "@/lib/clientApi";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await postJson("/api/auth/logout");
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
    >
      Log out
    </button>
  );
}
