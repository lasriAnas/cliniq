"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";

export async function findPatientRecord(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const dob = formData.get("dob") as string;

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
        "No unregistered patient record found. Contact the clinic if you need help.",
      )}`,
    );
  }

  if (!patient.email) {
    redirect(
      `/portal/register?error=${encodeURIComponent(
        "No email address on file for this record. Ask the clinic to add your email before registering.",
      )}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: patient.email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    redirect(
      `/portal/register?error=${encodeURIComponent("Failed to send verification code. Try again.")}`,
    );
  }

  redirect(
    `/portal/register?step=verify&email=${encodeURIComponent(patient.email)}&patientId=${patient.id}`,
  );
}

export async function verifyOtpCode(formData: FormData) {
  const email = formData.get("email") as string;
  const token = (formData.get("token") as string).trim();
  const patientId = formData.get("patientId") as string;

  if (!email || !token || !patientId) {
    redirect(`/portal/register?error=${encodeURIComponent("Missing fields.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });

  if (error) {
    redirect(
      `/portal/register?step=verify&email=${encodeURIComponent(email)}&patientId=${patientId}&error=${encodeURIComponent(
        "Invalid or expired code. Check your inbox or go back to resend.",
      )}`,
    );
  }

  redirect(
    `/portal/register?step=password&email=${encodeURIComponent(email)}&patientId=${patientId}`,
  );
}

export async function setPortalPassword(formData: FormData) {
  const password = formData.get("password") as string;
  const patientId = formData.get("patientId") as string;

  if (!password || !patientId) {
    redirect(`/portal/register?error=${encodeURIComponent("Missing fields.")}`);
  }

  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect(`/portal/register?error=${encodeURIComponent("Session expired. Please start again.")}`);
  }

  // Guard: patient must still be unlinked
  const patient = await withRetry(() =>
    prisma.patient.findUnique({ where: { id: patientId } }),
  );

  if (!patient || patient.userId !== null) {
    redirect(
      `/portal/register?error=${encodeURIComponent(
        "This record is already registered. Please sign in.",
      )}`,
    );
  }

  const { error: pwError } = await supabase.auth.updateUser({ password });
  if (pwError) {
    redirect(
      `/portal/register?step=password&patientId=${patientId}&error=${encodeURIComponent(
        pwError.message ?? "Failed to set password.",
      )}`,
    );
  }

  await withRetry(() =>
    prisma.patient.update({
      where: { id: patientId },
      data: { userId: userData.user.id },
    }),
  );

  revalidatePath("/", "layout");
  redirect("/portal");
}
