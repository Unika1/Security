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

          {/* Divider */}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-stone-200" />
            <span className="text-xs text-stone-400">or</span>
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          {/* Sign in with Google. This is a normal link to the backend, which
              starts the OAuth flow and redirects to Google. */}
          <a
            href="http://localhost:5000/api/auth/google"
            className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 py-2.5 font-medium text-stone-700 transition hover:bg-stone-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Continue with Google
          </a>

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
