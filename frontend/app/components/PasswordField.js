"use client";

import { useState } from "react";

/*
  A password input with a Show/Hide toggle. Flipping the input's type between
  "password" (dots) and "text" (readable) is all the toggle does — the value
  never leaves the field.
*/
export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  minLength,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 pr-16 text-stone-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-stone-500 hover:text-stone-800"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
