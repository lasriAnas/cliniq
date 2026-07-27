"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { requirePatient } from "@/lib/portal-auth";
import { createNotification } from "@/app/dashboard/notifications/actions";

export async function portalBookAppointment(formData: FormData) {
  const patient = await requirePatient();

  const doctorId = formData.get("doctorId") as string;
  const scheduledAt = formData.get("scheduledAt") as string;

  if (!doctorId || !scheduledAt) {
    throw new Error("Doctor and appointment time are required.");
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
    throw new Error("Please pick a future date and time.");
  }

  const appointment = await withRetry(() =>
    prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        scheduledAt: scheduledDate,
        status: "SCHEDULED",
      },
    }),
  );

  const formattedDate = scheduledDate.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  await createNotification({
    profileId: doctorId,
    type: "APPOINTMENT_BOOKED",
    body: `New appointment booked by ${patient.name} for ${formattedDate}`,
    link: "/dashboard/appointments",
  });

  revalidatePath("/portal/appointments");
  revalidatePath("/portal");
  return appointment;
}
