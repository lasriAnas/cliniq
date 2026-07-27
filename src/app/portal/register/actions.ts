"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";

export async function findPatientRecord(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const dob = formData.get("dob") as string; // "YYYY-MM-DD"

  if (!name || !dob) {
    redirect(`/portal/register?error=${encodeURIComponent("Name and date of birth are required.")}`);
  }

  const dobDate = new Date(dob);
  const nextDay = new Date(dobDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const patient = await withRetry(() =>
    prisma.patient.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        dob: { gte: dobDate, lt: nextDay },
        userId: null,
      },
    }),
  );

  if (!patient) {
    redirect(
      `/portal/register?error=${encodeURIComponent(
        "No unregistered patient record found with that name and date of birth. Contact the clinic if you need help.",
      )}`,
    );
  }

  redirect(`/portal/register?patientId=${patient.id}&name=${encodeURIComponent(patient.name)}`);
}

export async function createPortalAccount(formData: FormData) {
  const patientId = formData.get("patientId") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!patientId || !email || !password) {
    redirect(`/portal/register?error=${encodeURIComponent("Missing required fields.")}`);
  }

  // Double-check the patient record is still unlinked
  const patient = await withRetry(() =>
    prisma.patient.findUnique({ where: { id: patientId } }),
  );

  if (!patient || patient.userId !== null) {
    redirect(
      `/portal/register?error=${encodeURIComponent("This patient record is already registered. Please sign in.")}`,
    );
  }

  // Create a Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    redirect(
      `/portal/register?patientId=${patientId}&name=${encodeURIComponent(patient.name)}&error=${encodeURIComponent(
        authError?.message ?? "Failed to create account.",
      )}`,
    );
  }

  // Link the Supabase user to the Patient record
  await withRetry(() =>
    prisma.patient.update({
      where: { id: patientId },
      data: { userId: authData.user.id },
    }),
  );

  // Sign in immediately
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

  revalidatePath("/", "layout");
  redirect("/portal");
}
