import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { getCurrentProfile } from "@/lib/auth";
import { AppointmentsView, type AppointmentRow } from "@/components/appointments/appointments-view";
import { AppointmentCreateDialog } from "@/components/appointments/appointment-create-dialog";

export default async function AppointmentsPage() {
  const [[appointments, doctors, patients], profile] = await Promise.all([
    withRetry(() =>
      Promise.all([
        prisma.appointment.findMany({
          orderBy: { scheduledAt: "asc" },
          include: { patient: true, doctor: true },
        }),
        prisma.profile.findMany({
          where: { role: "DOCTOR" },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        prisma.patient.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
      ]),
    ),
    getCurrentProfile(),
  ]);

  const canCreate = profile?.role === "ADMIN" || profile?.role === "RECEPTIONIST";

  const rows: AppointmentRow[] = appointments.map((appt) => ({
    id: appt.id,
    patientId: appt.patientId,
    patientName: appt.patient.name,
    doctorId: appt.doctorId,
    doctorName: appt.doctor.name,
    scheduledAt: appt.scheduledAt.toISOString(),
    status: appt.status,
    notes: appt.notes ?? null,
    diagnosis: appt.diagnosis ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Appointments</h1>
        {canCreate && <AppointmentCreateDialog patients={patients} doctors={doctors} />}
      </div>
      <AppointmentsView
        data={rows}
        doctors={doctors}
        currentProfileId={profile?.id ?? ""}
        currentRole={profile?.role ?? ""}
      />
    </div>
  );
}
