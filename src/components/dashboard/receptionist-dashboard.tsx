import Link from "next/link";
import { formatTime } from "@/lib/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TodayAppointment = {
  id: string;
  scheduledAt: Date;
  status: string;
  patientName: string;
  doctorName: string;
};

interface ReceptionistDashboardProps {
  receptionistName: string;
  todayAppointments: TodayAppointment[];
  unpaidInvoiceCount: number;
  outstandingAmount: number;
  newPatientsThisWeek: number;
  unreadMessages: number;
}

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function ReceptionistDashboard({
  receptionistName,
  todayAppointments,
  unpaidInvoiceCount,
  outstandingAmount,
  newPatientsThisWeek,
  unreadMessages,
}: ReceptionistDashboardProps) {
  const scheduledToday = todayAppointments.filter((a) => a.status === "SCHEDULED").length;
  const completedToday = todayAppointments.filter((a) => a.status === "COMPLETED").length;
  const now = new Date();

  // Split into upcoming vs past for the check-in view
  const upcoming = todayAppointments.filter(
    (a) => a.status === "SCHEDULED" && a.scheduledAt >= now,
  );
  const rest = todayAppointments.filter(
    (a) => !(a.status === "SCHEDULED" && a.scheduledAt >= now),
  );
  const sorted = [...upcoming, ...rest];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Good day, {receptionistName}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Alerts row */}
      {(unpaidInvoiceCount > 0 || unreadMessages > 0) && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {unpaidInvoiceCount > 0 && (
            <Link
              href="/dashboard/billing"
              className="flex-1 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4 hover:brightness-95 transition-[filter]"
            >
              <p className="font-semibold text-red-800 dark:text-red-300">
                {unpaidInvoiceCount} unpaid invoice{unpaidInvoiceCount !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
                {outstandingAmount.toLocaleString()} MAD outstanding
              </p>
            </Link>
          )}
          {unreadMessages > 0 && (
            <Link
              href="/dashboard/messages"
              className="flex-1 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4 hover:brightness-95 transition-[filter]"
            >
              <p className="font-semibold text-blue-800 dark:text-blue-300">
                {unreadMessages} unread message{unreadMessages !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">Open inbox to reply</p>
            </Link>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Appointments today</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{todayAppointments.length}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">Pending: {scheduledToday}</Badge>
              <Badge variant="outline" className="text-xs">Done: {completedToday}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{upcoming.length}</div>
            <p className="text-sm text-muted-foreground mt-0.5">Still to arrive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">New patients</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{newPatientsThisWeek}</div>
            <p className="text-sm text-muted-foreground mt-0.5">Registered this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Unpaid invoices</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{unpaidInvoiceCount}</div>
            <Link href="/dashboard/billing" className="text-sm text-primary hover:underline mt-0.5 inline-block">
              Go to billing
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Today's check-in list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today&apos;s schedule</CardTitle>
            <Link href="/dashboard/appointments" className="text-sm text-muted-foreground hover:underline">
              Manage appointments
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments scheduled for today.</p>
          ) : (
            <div className="flex flex-col divide-y">
              {sorted.map((appt) => (
                <div key={appt.id} className="py-3 flex items-center gap-3">
                  <span className="w-14 shrink-0 text-sm tabular-nums text-muted-foreground">
                    {formatTime(appt.scheduledAt)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{appt.patientName}</p>
                    <p className="text-xs text-muted-foreground">Dr. {appt.doctorName}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[appt.status] ?? ""}`}>
                    {appt.status[0]}{appt.status.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
