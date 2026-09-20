import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { getCurrentProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-date";
import { BillingTable, type InvoiceRow } from "@/components/billing/billing-table";
import { InvoiceCreateDialog } from "@/components/billing/invoice-create-dialog";

export default async function BillingPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "ADMIN" && profile?.role !== "RECEPTIONIST") {
    redirect("/dashboard/patients");
  }

  const [invoices, uninvoicedAppointments] = await withRetry(() =>
    Promise.all([
      prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        include: { appointment: { include: { patient: true, doctor: true } } },
      }),
      prisma.appointment.findMany({
        where: { invoice: null },
        orderBy: { scheduledAt: "desc" },
        include: { patient: true, doctor: true },
      }),
    ]),
  );

  const rows: InvoiceRow[] = invoices.map((invoice) => ({
    id: invoice.id,
    patientId: invoice.appointment.patientId,
    patientName: invoice.appointment.patient.name,
    doctorName: invoice.appointment.doctor.name,
    scheduledAt: invoice.appointment.scheduledAt.toISOString(),
    paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
    amount: invoice.amount,
    status: invoice.status,
    createdAt: invoice.createdAt.toISOString(),
    appointmentCompleted: invoice.appointment.status === "COMPLETED",
  }));

  const appointmentOptions = uninvoicedAppointments.map((appt) => ({
    id: appt.id,
    name: `${appt.patient.name} — Dr. ${appt.doctor.name} — ${formatDateTime(appt.scheduledAt)}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <InvoiceCreateDialog appointments={appointmentOptions} />
      </div>
      <BillingTable data={rows} />
    </div>
  );
}
