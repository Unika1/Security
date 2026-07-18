"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { postJson } from "@/lib/clientApi";
import PasswordField from "../components/PasswordField";
import PasswordStrength from "../components/PasswordStrength";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";

  // "email" = ask for the account email. "reset" = enter code + new password.
  const [step, setStep] = useState("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // STEP 1: ask the server to email a reset code.
  async function handleEmailSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const { ok, data } = await postJson("/api/auth/forgot-password", { email });
      if (!ok) {
        setError(data?.error || "Something went wrong.");
        return;
      }
      setNotice("If an account exists for that email, a 6-digit code is on its way.");
      setStep("reset");
    } catch {
      setError("Could not reach the server. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: send the code and the new password.
  async function handleResetSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await postJson("/api/auth/reset-password", {
        email,
        code,
        password,
      });
      if (!ok) {
        setError(data?.error || "Could not reset the password.");
        return;
      }
      // Done. Send them to log in with the new password.
      router.push("/login?reset=1");
    } catch {
      setError("Could not reach the server. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900">
        {step === "email" ? "Forgot your password?" : "Set a new password"}
      </h1>
      <p className="mt-2 text-stone-600">
        {step === "email"
          ? "Enter your account email and we'll send you a 6-digit reset code."
          : `Enter the code we sent to ${email} and choose a new password.`}
      </p>

      {expired && step === "email" && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Your password has expired (older than 90 days). Please reset it to continue.
        </p>
      )}

      {step === "email" ? (
        <form
          onSubmit={handleEmailSubmit}
          noValidate
          className="mt-8 space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset code"}
          </button>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </form>
      ) : (
        <form
          onSubmit={handleResetSubmit}
          noValidate
          className="mt-8 space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          {notice && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {notice}
            </p>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-stone-700">
              6-digit code
            </label>
            <input
              id="code"
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className={inputClass}
            />
          </div>

          <PasswordField
            id="password"
            label="New password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            minLength={8}
          />
          <PasswordStrength password={password} />

          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
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
            {loading ? "Saving…" : "Reset password"}
          </button>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setPassword("");
              setConfirmPassword("");
              setError("");
              setNotice("");
            }}
            className="w-full text-sm text-stone-500 hover:underline"
          >
            Back
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-stone-600">
        Remembered it after all?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
