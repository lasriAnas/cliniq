"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

  redirect(
    `/portal/register?step=email&patientId=${patient.id}&name=${encodeURIComponent(patient.name)}`,
  );
}

export async function createPortalAccount(formData: FormData) {
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;
  const patientId = formData.get("patientId") as string;

  if (!email || !password || !patientId) {
    redirect(
      `/portal/register?step=email&patientId=${patientId}&error=${encodeURIComponent("All fields are required.")}`,
    );
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

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    redirect(
      `/portal/register?step=email&patientId=${patientId}&error=${encodeURIComponent(
        error.message ?? "Failed to create account. Try a different email.",
      )}`,
    );
  }

  await withRetry(() =>
    prisma.patient.update({
      where: { id: patientId },
      data: { userId: data.user.id, email },
    }),
  );

  revalidatePath("/", "layout");
  redirect("/login?registered=1");
}
