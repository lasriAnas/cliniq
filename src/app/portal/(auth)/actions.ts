"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { getCurrentPatient } from "@/lib/portal-auth";

export async function portalSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function cancelAppointment(appointmentId: string) {
  const patient = await getCurrentPatient();
  if (!patient) redirect("/login");

  // Verify the appointment belongs to this patient and is still upcoming
  const appt = await withRetry(() =>
    prisma.appointment.findUnique({ where: { id: appointmentId } }),
  );

  if (!appt || appt.patientId !== patient.id || appt.status !== "SCHEDULED") {
    return;
  }

  await withRetry(() =>
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
    }),
  );

  revalidatePath("/portal/appointments");
}
