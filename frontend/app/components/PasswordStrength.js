"use client";

/*
  A live password-strength meter shown under the password box.

  It checks the same rules the server enforces (length + character types) and
  gives the user real-time feedback. This is a usability aid only — the server
  is still the real gatekeeper (it rejects weak passwords with 400).
*/

// Each rule: a label and a test function.
const RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "A number", test: (p) => /[0-9]/.test(p) },
  { label: "A symbol (!?@#)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const passed = RULES.filter((r) => r.test(password)).length;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"];
  const colors = ["#dc2626", "#dc2626", "#d97706", "#d97706", "#16a34a", "#16a34a"];

  return (
    <div className="mt-2">
      {/* strength bar */}
      <div className="flex gap-1">
        {RULES.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: i < passed ? colors[passed] : "#e5e7eb" }}
          />
        ))}
      </div>
      <p className="mt-1 text-xs font-medium" style={{ color: colors[passed] }}>
        {labels[passed]}
      </p>

      {/* checklist of what's still missing */}
      <ul className="mt-1 space-y-0.5">
        {RULES.map((r) => {
          const ok = r.test(password);
          return (
            <li
              key={r.label}
              className={`text-xs ${ok ? "text-green-600" : "text-stone-400"}`}
            >
              {ok ? "✓" : "○"} {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
