import Link from "next/link";
import { getCurrentPatient } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/with-retry";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, FileText, Receipt } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default async function PortalHomePage() {
  const patient = (await getCurrentPatient())!;

  const [upcomingAppointments, unpaidInvoices, recentPrescriptions] = await withRetry(() =>
    Promise.all([
      prisma.appointment.findMany({
        where: {
          patientId: patient.id,
          status: "SCHEDULED",
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: "asc" },
        take: 3,
        include: { doctor: { select: { name: true } } },
      }),
      prisma.invoice.count({
        where: {
          status: "UNPAID",
          appointment: { patientId: patient.id },
        },
      }),
      prisma.prescription.findMany({
        where: { appointment: { patientId: patient.id } },
        orderBy: { createdAt: "desc" },
        take: 2,
        include: {
          appointment: { include: { doctor: { select: { name: true } } } },
          items: true,
        },
      }),
    ]),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {patient.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s an overview of your health activity.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <CalendarDays className="h-8 w-8 text-emerald-600 shrink-0" />
            <div>
              <p className="text-2xl font-semibold">{upcomingAppointments.length}</p>
              <p className="text-xs text-muted-foreground">Upcoming appointment{upcomingAppointments.length !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <Receipt className="h-8 w-8 text-amber-500 shrink-0" />
            <div>
              <p className="text-2xl font-semibold">{unpaidInvoices}</p>
              <p className="text-xs text-muted-foreground">Unpaid invoice{unpaidInvoices !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <FileText className="h-8 w-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-2xl font-semibold">{recentPrescriptions.length}</p>
              <p className="text-xs text-muted-foreground">Recent prescription{recentPrescriptions.length !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming appointments */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Upcoming appointments</h2>
          <Link href="/portal/appointments" className="text-sm text-muted-foreground underline hover:text-foreground">
            View all
          </Link>
        </div>
        {upcomingAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No upcoming appointments.{" "}
              <Link href="/portal/appointments" className="underline hover:text-foreground">
                Book one
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingAppointments.map((appt) => (
              <Card key={appt.id}>
                <CardContent className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-sm">Dr. {appt.doctor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(appt.scheduledAt).toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      at{" "}
                      {new Date(appt.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[appt.status] ?? "outline"}>{appt.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent prescriptions */}
      {recentPrescriptions.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Recent prescriptions</h2>
            <Link href="/portal/prescriptions" className="text-sm text-muted-foreground underline hover:text-foreground">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentPrescriptions.map((rx) => (
              <Card key={rx.id}>
                <CardContent className="py-3">
                  <p className="text-sm font-medium">Dr. {rx.appointment.doctor.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(rx.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {rx.items.map((item) => (
                      <li key={item.id} className="text-xs text-muted-foreground">
                        • {item.medicationName} — {item.dosage}
                        {item.duration ? `, ${item.duration}` : ""}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
