"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function register(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim();
  const dob = formData.get("dob") as string;
  const gender = formData.get("gender") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !dob || !gender || !password) {
    redirect(`/register?error=${encodeURIComponent("All fields are required.")}`);
  }

  if (gender !== "MALE" && gender !== "FEMALE") {
    redirect(`/register?error=${encodeURIComponent("Invalid gender value.")}`);
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    redirect(
      `/register?error=${encodeURIComponent(
        error.message.includes("already registered")
          ? "An account with that email already exists."
          : error.message ?? "Failed to create account. Please try again.",
      )}`,
    );
  }

  await withRetry(() =>
    prisma.patient.create({
      data: {
        name,
        email,
        dob: new Date(dob),
        gender: gender as "MALE" | "FEMALE",
        phone: "",
        userId: data.user.id,
      },
    }),
  );

  revalidatePath("/", "layout");
  redirect("/login?registered=1");
}
