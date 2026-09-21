"use server";

import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format-date";
import { appointmentSchema } from "@/lib/schemas/appointment";
import { withRetry } from "@/lib/with-retry";
import { requireRole } from "@/lib/auth";
import { buildPatientAdvicePrompt } from "@/lib/build-patient-advice-prompt";
import { createNotification } from "@/app/dashboard/notifications/actions";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export async function createAppointment(formData: FormData) {
  await requireRole(["ADMIN", "RECEPTIONIST"]);

  const parsed = appointmentSchema.safeParse({
    patientId: formData.get("patientId"),
    doctorId: formData.get("doctorId"),
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid appointment data");
  }

  const [appointment, doctor] = await Promise.all([
    withRetry(() =>
      prisma.appointment.create({
        data: {
          ...parsed.data,
          scheduledAt: new Date(parsed.data.scheduledAt),
        },
      }),
    ),
    withRetry(() =>
      prisma.profile.findUnique({
        where: { id: parsed.data.doctorId },
        select: { name: true },
      }),
    ),
  ]);

  const scheduledDate = formatDateTime(parsed.data.scheduledAt);

  await createNotification({
    profileId: parsed.data.doctorId,
    type: "APPOINTMENT_BOOKED",
    body: `New appointment scheduled for ${scheduledDate}`,
    link: "/dashboard/appointments",
  });

  revalidatePath("/dashboard/appointments");
  return appointment;
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  await requireRole(["ADMIN", "DOCTOR", "RECEPTIONIST"]);

  await withRetry(() => prisma.appointment.update({ where: { id }, data: { status } }));
  revalidatePath("/dashboard/appointments");
}

export async function updateAppointmentNotes(id: string, notes: string) {
  const actor = await requireRole(["ADMIN", "DOCTOR"]);

  if (actor.role === "DOCTOR") {
    const appt = await withRetry(() =>
      prisma.appointment.findUnique({ where: { id }, select: { doctorId: true } }),
    );
    if (!appt || appt.doctorId !== actor.id) {
      throw new Error("You can only edit notes for your own appointments");
    }
  }

  await withRetry(() =>
    prisma.appointment.update({ where: { id }, data: { notes: notes.trim() || null } }),
  );
  revalidatePath("/dashboard/appointments");
}

export async function updateAppointmentDiagnosis(id: string, diagnosis: string) {
  const actor = await requireRole(["ADMIN", "DOCTOR"]);

  if (actor.role === "DOCTOR") {
    const appt = await withRetry(() =>
      prisma.appointment.findUnique({ where: { id }, select: { doctorId: true } }),
    );
    if (!appt || appt.doctorId !== actor.id) {
      throw new Error("You can only set a diagnosis for your own appointments");
    }
  }

  await withRetry(() =>
    prisma.appointment.update({ where: { id }, data: { diagnosis: diagnosis.trim() || null } }),
  );
  revalidatePath("/dashboard/appointments");
}

export async function generatePatientAdvice(diagnosis: string): Promise<{ advice?: string; error?: string }> {
  await requireRole(["ADMIN", "DOCTOR"]);

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const result = await model.generateContent(buildPatientAdvicePrompt(diagnosis));
    return { advice: result.response.text() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { error: `AI generation failed: ${msg}` };
  }
}

export async function summarizeAppointmentNotes(notes: string): Promise<{ summary?: string; error?: string }> {
  await requireRole(["ADMIN", "DOCTOR"]);

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const result = await model.generateContent(
      `You are a clinical documentation assistant. Rewrite the following raw appointment notes into a structured SOAP format (Subjective, Objective, Assessment, Plan). Be concise, use professional medical language, and preserve all clinical details. If a section has no information, write "Not documented."\n\nRaw notes:\n${notes}`
    );
    return { summary: result.response.text() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { error: `AI generation failed: ${msg}` };
  }
}
