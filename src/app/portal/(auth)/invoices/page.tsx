import { getCurrentPatient } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  UNPAID: "destructive",
  PAID: "secondary",
  CANCELLED: "outline",
};

export default async function PortalInvoicesPage() {
  const patient = (await getCurrentPatient())!;

  const invoices = await withRetry(() =>
    prisma.invoice.findMany({
      where: { appointment: { patientId: patient.id } },
      orderBy: { createdAt: "desc" },
      include: {
        appointment: {
          include: { doctor: { select: { name: true } } },
        },
      },
    }),
  );

  const totalUnpaid = invoices
    .filter((inv) => inv.status === "UNPAID")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-muted-foreground mt-1">Your billing history.</p>
      </div>

      {totalUnpaid > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-900/20">
          <span className="font-medium text-amber-800 dark:text-amber-300">
            Outstanding balance: {totalUnpaid.toLocaleString()} MAD
          </span>{" "}
          <span className="text-amber-700 dark:text-amber-400">
            — please contact the clinic to settle your balance.
          </span>
        </div>
      )}

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No invoices on record yet.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {invoices.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium">Dr. {inv.appointment.doctor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.appointment.scheduledAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {inv.paidAt && (
                      <>
                        {" "}· Paid{" "}
                        {new Date(inv.paidAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium tabular-nums">{inv.amount.toLocaleString()} MAD</span>
                  <Badge variant={STATUS_VARIANT[inv.status] ?? "outline"}>{inv.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
