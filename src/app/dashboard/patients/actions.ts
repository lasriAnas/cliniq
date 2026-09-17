"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { patientSchema } from "@/lib/schemas/patient";
import { withRetry } from "@/lib/with-retry";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function createPatient(formData: FormData) {
  await requireRole(["ADMIN", "RECEPTIONIST"]);

  const parsed = patientSchema.safeParse({
    name: formData.get("name"),
    dob: formData.get("dob"),
    gender: formData.get("gender"),
    phone: formData.get("phone"),
    address: formData.get("address") || undefined,
    email: formData.get("email") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid patient data");
  }

  const patient = await withRetry(() =>
    prisma.patient.create({
      data: {
        ...parsed.data,
        dob: new Date(parsed.data.dob),
      },
    }),
  );

  revalidatePath("/dashboard/patients");
  return patient;
}

export async function getPatientDetail(id: string) {
  const patient = await withRetry(() =>
    prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { scheduledAt: "desc" },
          include: {
            doctor: true,
            invoice: true,
            prescription: { include: { items: { orderBy: { createdAt: "asc" } } } },
          },
        },
      },
    }),
  );

  if (!patient) return null;

  const unpaidInvoices = patient.appointments
    .filter((appt) => appt.invoice && appt.invoice.status === "UNPAID")
    .map((appt) => ({
      id: appt.invoice!.id,
      amount: appt.invoice!.amount,
      scheduledAt: appt.scheduledAt.toISOString(),
    }));

  return {
    id: patient.id,
    name: patient.name,
    dob: patient.dob.toISOString().slice(0, 10),
    gender: patient.gender,
    phone: patient.phone,
    address: patient.address,
    unpaidInvoices,
    appointments: patient.appointments.map((appt) => ({
      id: appt.id,
      doctorName: appt.doctor.name,
      scheduledAt: appt.scheduledAt.toISOString(),
      status: appt.status,
      invoiceStatus: appt.invoice?.status ?? null,
      invoiceAmount: appt.invoice?.amount ?? null,
      prescriptionId: appt.prescription?.id ?? null,
      prescriptionItems: (appt.prescription?.items ?? []).map((item) => ({
        id: item.id,
        medicationName: item.medicationName,
        dosage: item.dosage,
        duration: item.duration,
        notes: item.notes,
      })),
    })),
  };
}

export async function deletePatient(id: string) {
  const actor = await requireRole(["ADMIN"]);

  const patient = await withRetry(() => prisma.patient.delete({ where: { id } }));
  await logAudit({
    actor,
    action: "PATIENT_DELETED",
    targetType: "Patient",
    targetId: id,
    details: `Deleted patient ${patient.name}`,
  });
  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard/appointments");
}
