"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { requirePatient } from "@/lib/portal-auth";
import { createNotification } from "@/app/dashboard/notifications/actions";
import { portalBookingSchema } from "@/lib/schemas/portal-booking";

export async function portalBookAppointment(formData: FormData) {
  const patient = await requirePatient();

  const parsed = portalBookingSchema.safeParse({
    doctorId: formData.get("doctorId"),
    scheduledAt: formData.get("scheduledAt"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid booking data.");
  }

  const { doctorId, scheduledAt } = parsed.data;
  const scheduledDate = new Date(scheduledAt);

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
