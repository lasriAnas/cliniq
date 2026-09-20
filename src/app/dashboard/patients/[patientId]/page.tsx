import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { getCurrentProfile } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PrintButton } from "@/components/print-button";

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { patientId } = await params;

  const patient = await withRetry(() =>
    prisma.patient.findUnique({
      where: { id: patientId },
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

  if (!patient) notFound();

  const upcoming = patient.appointments.filter(
    (a) => a.status === "SCHEDULED" && new Date(a.scheduledAt) >= new Date(),
  );
  const past = patient.appointments.filter(
    (a) => a.status !== "SCHEDULED" || new Date(a.scheduledAt) < new Date(),
  );

  const appointmentsWithRx = patient.appointments.filter(
    (a) => a.prescription && a.prescription.items.length > 0,
  );

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto print:gap-6">
      {/* Screen header */}
      <div className="flex items-start justify-between print:hidden">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard/patients"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to patients
          </Link>
          <h1 className="text-2xl font-semibold">{patient.name}</h1>
        </div>
        <PrintButton />
      </div>

      {/* Print header */}
      <div className="hidden print:flex flex-col items-center gap-1 border-b pb-4 text-center">
        <div className="text-xl font-semibold">CliniQ</div>
        <div className="text-lg">{patient.name}</div>
      </div>

      {/* Patient info */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Patient information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <div className="text-muted-foreground">Date of birth</div>
            <div>{formatDate(patient.dob)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Gender</div>
            <div>{patient.gender === "MALE" ? "Male" : "Female"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Phone</div>
            <div>{patient.phone}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Address</div>
            <div>{patient.address ?? "—"}</div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Appointments */}
      <section className="flex flex-col gap-4 print:hidden">
        <h2 className="text-base font-medium">Appointments</h2>

        {upcoming.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-sm text-muted-foreground font-medium">Upcoming</div>
            {upcoming.map((appt) => (
              <AppointmentRow key={appt.id} appt={appt} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="flex flex-col gap-2">
            {upcoming.length > 0 && (
              <div className="text-sm text-muted-foreground font-medium">Past</div>
            )}
            {past.map((appt) => (
              <AppointmentRow key={appt.id} appt={appt} />
            ))}
          </div>
        )}

        {patient.appointments.length === 0 && (
          <p className="text-sm text-muted-foreground">No appointments yet.</p>
        )}
      </section>

      {/* Prescription history */}
      {appointmentsWithRx.length > 0 && (
        <>
          <Separator className="print:hidden" />
          <section className="flex flex-col gap-6">
            <h2 className="text-base font-medium">Prescriptions</h2>
            {appointmentsWithRx.map((appt) => (
              <div
                key={appt.id}
                className="flex flex-col gap-4 rounded-lg border p-6 print:break-inside-avoid"
              >
                {/* Prescription header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">Dr. {appt.doctor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(appt.scheduledAt)}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>Patient: {patient.name}</div>
                    <div>DOB: {formatDate(patient.dob)}</div>
                  </div>
                </div>

                <Separator />

                {/* Medication items */}
                <div className="flex flex-col gap-3">
                  {appt.prescription!.items.map((item, i) => (
                    <div key={item.id} className="grid grid-cols-[1.5rem_1fr] gap-2 text-sm">
                      <div className="text-muted-foreground font-mono pt-0.5">{i + 1}.</div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{item.medicationName}</span>
                        <span className="text-muted-foreground">
                          {item.dosage} — {item.duration}
                        </span>
                        {item.notes && (
                          <span className="text-muted-foreground italic text-xs">{item.notes}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Signature line */}
                <div className="mt-4 flex justify-end text-xs text-muted-foreground print:mt-8">
                  <div className="border-t border-current pt-1 w-40 text-center">
                    Dr. {appt.doctor.name}
                  </div>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

type Appt = {
  id: string;
  scheduledAt: Date;
  status: string;
  doctor: { name: string };
  invoice: { status: string; amount: number } | null;
  prescription: { items: { id: string }[] } | null;
};

function AppointmentRow({ appt }: { appt: Appt }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <div>
        <div className="font-medium">Dr. {appt.doctor.name}</div>
        <div className="text-muted-foreground">{formatDateTime(appt.scheduledAt)}</div>
      </div>
      <div className="flex items-center gap-2">
        {appt.prescription && appt.prescription.items.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {appt.prescription.items.length} Rx
          </span>
        )}
        {appt.invoice && (
          <Badge variant={appt.invoice.status === "UNPAID" ? "destructive" : "secondary"}>
            {appt.invoice.status === "UNPAID"
              ? `UNPAID · ${appt.invoice.amount} MAD`
              : appt.invoice.status}
          </Badge>
        )}
        <Badge variant="secondary">{appt.status}</Badge>
      </div>
    </div>
  );
}
