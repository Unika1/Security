"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { postJson } from "@/lib/clientApi";
import PasswordField from "../components/PasswordField";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const justReset = searchParams.get("reset") === "1";

  // "password" = step 1 (enter email/password). "otp" = step 2 (enter code).
  const [step, setStep] = useState("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(""); // green info message (e.g. "code re-sent")
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // STEP 1: send email + password. If correct, the server emails a code and
  // asks us to move to the code-entry step.
  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { ok, data } = await postJson("/api/auth/login", {
        email,
        password,
      });
      if (!ok) {
        // Password expired, so send the user to reset it.
        if (data?.passwordExpired) {
          router.push("/forgot-password?expired=1");
          return;
        }
        setError(data?.error || "Login failed.");
        return;
      }
      setStep("otp"); // move to the code-entry screen
    } catch {
      setError("Could not reach the server. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: send the 6-digit code. If correct, we're logged in.
  async function handleOtpSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { ok, data } = await postJson("/api/auth/verify-otp", {
        email,
        code,
      });
      if (!ok) {
        setError(data?.error || "Verification failed.");
        return;
      }
      router.push("/profile");
      router.refresh();
    } catch {
      setError("Could not reach the server. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  // Ask the server to email a fresh code. The server refuses if the last one
  // was sent under 30 seconds ago (it tells us how long to wait).
  async function handleResend() {
    setError("");
    setNotice("");
    setResending(true);
    try {
      const { ok, data } = await postJson("/api/auth/resend-otp", { email });
      if (!ok) {
        setError(data?.error || "Could not resend the code.");
        return;
      }
      setNotice("A new code was sent. Check your email.");
      setCode("");
    } catch {
      setError("Could not reach the server. Is it running?");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900">
        {step === "password" ? "Welcome back" : "Enter your code"}
      </h1>
      <p className="mt-2 text-stone-600">
        {step === "password"
          ? "Log in to your CityMate account."
          : `We sent a 6-digit code to ${email}. Enter it below to finish logging in.`}
      </p>

      {justRegistered && step === "password" && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Account created. Please log in with your new email and password.
        </p>
      )}

      {justReset && step === "password" && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Password changed. Please log in with your new password.
        </p>
      )}

      {step === "password" ? (
        <form
          onSubmit={handlePasswordSubmit}
          noValidate
          className="mt-8 space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />
          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />
          <SubmitButton loading={loading}>
            {loading ? "Checking…" : "Continue"}
          </SubmitButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <p className="text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-stone-500 hover:text-brand hover:underline"
            >
              Forgot your password?
            </Link>
          </p>
        </form>
      ) : (
        <form
          onSubmit={handleOtpSubmit}
          noValidate
          className="mt-8 space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <Field
            id="code"
            label="6-digit code"
            type="text"
            value={code}
            onChange={setCode}
            placeholder="123456"
            inputMode="numeric"
            maxLength={6}
          />
          <SubmitButton loading={loading}>
            {loading ? "Verifying…" : "Verify and log in"}
          </SubmitButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {notice && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {notice}
            </p>
          )}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full text-sm font-semibold text-brand hover:underline disabled:opacity-60"
          >
            {resending ? "Sending a new code…" : "Didn't get it? Resend code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("password");
              setCode("");
              setError("");
              setNotice("");
            }}
            className="w-full text-sm text-stone-500 hover:underline"
          >
            Back
          </button>
        </form>
      )}

      {step === "password" && (
        <p className="mt-6 text-center text-sm text-stone-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand hover:underline"
          >
            Create one
          </Link>
        </p>
      )}
    </div>
  );
}

// --- Small reusable pieces to keep the form readable ---

function Field({ id, label, value, onChange, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={id}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        {...rest}
      />
    </div>
  );
}

function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function ErrorMessage({ children }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </p>
  );
}
