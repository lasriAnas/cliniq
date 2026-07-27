import { getCurrentPatient } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PortalBookingForm } from "@/components/portal/portal-booking-form";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default async function PortalAppointmentsPage() {
  const patient = (await getCurrentPatient())!;

  const [appointments, doctors] = await withRetry(() =>
    Promise.all([
      prisma.appointment.findMany({
        where: { patientId: patient.id },
        orderBy: { scheduledAt: "desc" },
        include: {
          doctor: { select: { name: true } },
          prescription: { include: { items: true } },
        },
      }),
      prisma.profile.findMany({
        where: { role: "DOCTOR", active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]),
  );

  const upcoming = appointments.filter(
    (a) => a.status === "SCHEDULED" && new Date(a.scheduledAt) >= new Date(),
  );
  const past = appointments.filter(
    (a) => a.status !== "SCHEDULED" || new Date(a.scheduledAt) < new Date(),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <p className="text-muted-foreground mt-1">Your scheduled and past visits.</p>
      </div>

      {/* Book new */}
      <div className="flex flex-col gap-3">
        <h2 className="font-medium">Book a new appointment</h2>
        <Card>
          <CardContent className="pt-4">
            <PortalBookingForm doctors={doctors} />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-medium">Upcoming</h2>
          <div className="flex flex-col gap-2">
            {upcoming.map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      <div className="flex flex-col gap-3">
        <h2 className="font-medium">Past visits</h2>
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past appointments yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {past.map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({
  appt,
}: {
  appt: {
    id: string;
    scheduledAt: Date;
    status: string;
    diagnosis: string | null;
    notes: string | null;
    doctor: { name: string };
    prescription: { items: { id: string; medicationName: string; dosage: string; duration: string; notes: string | null }[] } | null;
  };
}) {
  return (
    <Card>
      <CardContent className="py-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm">Dr. {appt.doctor.name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(appt.scheduledAt).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              at{" "}
              {new Date(appt.scheduledAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[appt.status] ?? "outline"}>{appt.status}</Badge>
        </div>

        {appt.diagnosis && (
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Diagnosis</p>
            <p className="text-sm">{appt.diagnosis}</p>
          </div>
        )}

        {appt.prescription && appt.prescription.items.length > 0 && (
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Prescription</p>
            <ul className="flex flex-col gap-0.5">
              {appt.prescription.items.map((item) => (
                <li key={item.id} className="text-sm">
                  {item.medicationName} — {item.dosage}
                  {item.duration ? `, ${item.duration}` : ""}
                  {item.notes ? ` (${item.notes})` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
