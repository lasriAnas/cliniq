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
  const phone = (formData.get("phone") as string).trim();
  const address = (formData.get("address") as string | null)?.trim() || null;
  const password = formData.get("password") as string;

  if (!name || !email || !dob || !gender || !phone || !password) {
    redirect(`/register?error=${encodeURIComponent("All fields are required.")}`);
  }

  if (gender !== "MALE" && gender !== "FEMALE") {
    redirect(`/register?error=${encodeURIComponent("Invalid gender value.")}`);
  }

  if (!/^(?:(?:\+212|00212)[- ]?|0)[5-7]\d{8}$/.test(phone)) {
    redirect(`/register?error=${encodeURIComponent("Enter a valid Moroccan number (e.g. 0612345678 or +212612345678).")}`);
  }

  // If a Supabase auth user exists for this email but has no patient record
  // (e.g. the patient was deleted from the dashboard), clean it up first.
  const existingPatient = await prisma.patient.findFirst({ where: { email } });
  if (!existingPatient) {
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const orphan = listData?.users.find((u) => u.email === email);
    if (orphan) {
      await supabaseAdmin.auth.admin.deleteUser(orphan.id);
    }
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
        phone,
        address,
        userId: data.user.id,
      },
    }),
  );

  revalidatePath("/", "layout");
  redirect("/login?registered=1");
}
