"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { register } from "./actions";

const PHONE_RE = /^(?:(?:\+212|00212)[- ]?|0)[5-7]\d{8}$/;

function validateField(name: string, value: string): string {
  switch (name) {
    case "name":
      return value.trim() ? "" : "Full name is required.";
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address.";
    case "dob":
      return value ? "" : "Date of birth is required.";
    case "gender":
      return value ? "" : "Please select a gender.";
    case "phone":
      return PHONE_RE.test(value)
        ? ""
        : "Enter a valid Moroccan number (e.g. 0612345678).";
    case "password":
      return value.length >= 8 ? "" : "Password must be at least 8 characters.";
    default:
      return "";
  }
}

type Errors = Record<string, string>;

export function RegisterForm({ serverError }: { serverError?: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function blur(name: string, value: string) {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((e) => ({ ...e, [name]: validateField(name, value) }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const data = new FormData(form);

    const fields = ["name", "email", "dob", "gender", "phone", "password"];
    const newErrors: Errors = {};
    let hasError = false;

    for (const f of fields) {
      const err = validateField(f, (data.get(f) as string) ?? "");
      if (err) { newErrors[f] = err; hasError = true; }
    }

    setErrors(newErrors);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));

    if (hasError) {
      e.preventDefault();
    }
    // if valid, don't preventDefault — the server action fires normally
  }

  return (
    <form onSubmit={handleSubmit} action={register} className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name" name="name" required autoComplete="name"
          onBlur={(e) => blur("name", e.target.value)}
          className={touched.name && errors.name ? "border-destructive" : ""}
        />
        {touched.name && errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email" name="email" type="email" required autoComplete="email"
          onBlur={(e) => blur("email", e.target.value)}
          className={touched.email && errors.email ? "border-destructive" : ""}
        />
        {touched.email && errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      {/* Date of birth */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dob">Date of birth</Label>
        <input
          id="dob" name="dob" type="date" required
          onBlur={(e) => blur("dob", e.target.value)}
          className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${touched.dob && errors.dob ? "border-destructive" : "border-input"}`}
        />
        {touched.dob && errors.dob && <p className="text-xs text-destructive">{errors.dob}</p>}
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gender">Gender</Label>
        <select
          id="gender" name="gender" required
          onBlur={(e) => blur("gender", e.target.value)}
          className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${touched.gender && errors.gender ? "border-destructive" : "border-input"}`}
        >
          <option value="">Select…</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        {touched.gender && errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone" name="phone" type="tel" required autoComplete="tel"
          onChange={(e) => {
            // strip anything that isn't a digit, +, -, or space
            const filtered = e.target.value.replace(/[^\d+\- ]/g, "");
            e.target.value = filtered;
            setErrors((err) => ({ ...err, phone: validateField("phone", filtered) }));
            setTouched((t) => ({ ...t, phone: true }));
          }}
          onBlur={(e) => blur("phone", e.target.value)}
          className={touched.phone && errors.phone ? "border-destructive" : ""}
        />
        {touched.phone && errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      {/* Address */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Address <span className="text-muted-foreground">(optional)</span></Label>
        <Input id="address" name="address" autoComplete="street-address" />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password" name="password" type="password" required minLength={8}
          autoComplete="new-password"
          onBlur={(e) => blur("password", e.target.value)}
          className={touched.password && errors.password ? "border-destructive" : ""}
        />
        {touched.password && errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full">Create account</Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline hover:text-foreground">Sign in</Link>
      </p>
    </form>
  );
}
