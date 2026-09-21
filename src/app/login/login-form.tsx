"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login } from "./actions";

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address.";
}

export function LoginForm({
  serverError,
  registered,
}: {
  serverError?: string;
  registered?: string;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  function blur(name: string, value: string) {
    setTouched((t) => ({ ...t, [name]: true }));
    if (name === "email") setErrors((e) => ({ ...e, email: validateEmail(value) }));
    if (name === "password") setErrors((e) => ({ ...e, password: value ? "" : "Password is required." }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = (data.get("email") as string) ?? "";
    const password = (data.get("password") as string) ?? "";

    const newErrors = {
      email: validateEmail(email),
      password: password ? "" : "Password is required.",
    };
    setErrors(newErrors);
    setTouched({ email: true, password: true });

    if (newErrors.email || newErrors.password) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    startTransition(() => form.submit());
  }

  return (
    <form onSubmit={handleSubmit} action={login} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email" name="email" type="email" required autoComplete="email"
          onBlur={(e) => blur("email", e.target.value)}
          className={touched.email && errors.email ? "border-destructive" : ""}
        />
        {touched.email && errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password" name="password" type="password" required
          autoComplete="current-password"
          onBlur={(e) => blur("password", e.target.value)}
          className={touched.password && errors.password ? "border-destructive" : ""}
        />
        {touched.password && errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>
      {registered && (
        <p className="text-sm text-emerald-600">Account created! Sign in with your new credentials.</p>
      )}
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New patient?{" "}
        <Link href="/register" className="underline hover:text-foreground">Create an account</Link>
      </p>
    </form>
  );
}
