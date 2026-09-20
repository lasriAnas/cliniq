import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { getCurrentProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-date";
import { PrintButton } from "@/components/print-button";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "ADMIN" && profile?.role !== "RECEPTIONIST") {
    redirect("/dashboard/patients");
  }

  const { invoiceId } = await params;

  const invoice = await withRetry(() =>
    prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { appointment: { include: { patient: true, doctor: true } } },
    }),
  );

  if (!invoice || invoice.status !== "PAID") {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 print:p-0">
      <PrintButton />

      <div className="mx-auto w-full max-w-lg rounded-lg border p-8 print:border-none print:p-0">
        <div className="flex flex-col items-center gap-1 border-b pb-4 text-center">
          <div className="text-xl font-semibold">CliniQ</div>
          <div className="text-sm text-muted-foreground">Payment receipt</div>
        </div>

        <dl className="mt-6 flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Receipt no.</dt>
            <dd className="font-mono">{invoice.id.slice(0, 8).toUpperCase()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Patient</dt>
            <dd>{invoice.appointment.patient.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Doctor</dt>
            <dd>Dr. {invoice.appointment.doctor.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Appointment date</dt>
            <dd>{formatDateTime(invoice.appointment.scheduledAt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Paid on</dt>
            <dd>{invoice.paidAt ? formatDateTime(invoice.paidAt) : "—"}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t pt-3 text-base font-semibold">
            <dt>Amount paid</dt>
            <dd>{invoice.amount.toLocaleString()} MAD</dd>
          </div>
        </dl>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Thank you. This receipt confirms payment was received in full.
        </div>
      </div>
    </div>
  );
}
