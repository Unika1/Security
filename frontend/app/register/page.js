"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { postJson } from "@/lib/clientApi";
import PasswordField from "../components/PasswordField";
import PasswordStrength from "../components/PasswordStrength";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Send the new account details to our register API. On success the server
  // hashes the password, saves the user, and logs them in automatically.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    // Catch typos before anything is sent to the server.
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { ok, data } = await postJson("/api/auth/register", {
        name,
        email,
        password,
      });

      if (!ok) {
        setError(data?.error || "Registration failed.");
        return;
      }

      // Success — send them to the login page to sign in with their new
      // account. The ?registered=1 flag lets the login page show a message.
      router.push("/login?registered=1");
    } catch {
      setError("Could not reach the server. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900">Create your account</h1>
      <p className="mt-2 text-stone-600">
        Join CityMate to save tours and plan your trip.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-stone-700"
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-stone-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          minLength={8}
        />
        <PasswordStrength password={password} />

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Type the same password again"
          minLength={8}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
