import Link from "next/link";
import { formatTime } from "@/lib/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TodayAppointment = {
  id: string;
  scheduledAt: Date;
  status: string;
  patientName: string;
};

interface DoctorDashboardProps {
  doctorName: string;
  todayAppointments: TodayAppointment[];
  patientsSeenThisWeek: number;
  prescriptionsThisWeek: number;
  unreadMessages: number;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function DoctorDashboard({
  doctorName,
  todayAppointments,
  patientsSeenThisWeek,
  prescriptionsThisWeek,
  unreadMessages,
}: DoctorDashboardProps) {
  const nextAppointment = todayAppointments.find((a) => a.status === "SCHEDULED");
  const scheduledCount = todayAppointments.filter((a) => a.status === "SCHEDULED").length;
  const completedCount = todayAppointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Good day, Dr. {doctorName}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Next appointment highlight */}
      {nextAppointment ? (
        <div className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">
            Next appointment
          </p>
          <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            {nextAppointment.patientName}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
            {formatTime(nextAppointment.scheduledAt)}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">No more scheduled appointments today.</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Today's schedule</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{todayAppointments.length}</div>
            <div className="mt-1 flex gap-1 flex-wrap">
              <Badge variant="outline" className="text-xs">Pending: {scheduledCount}</Badge>
              <Badge variant="outline" className="text-xs">Done: {completedCount}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Patients this week</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{patientsSeenThisWeek}</div>
            <p className="text-sm text-muted-foreground mt-0.5">Completed consultations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Prescriptions</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{prescriptionsThisWeek}</div>
            <p className="text-sm text-muted-foreground mt-0.5">Written this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Unread messages</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{unreadMessages}</div>
            <Link href="/dashboard/messages" className="text-sm text-primary hover:underline mt-0.5 inline-block">
              Open inbox
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Today's full appointment list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today&apos;s appointments</CardTitle>
            <Link href="/dashboard/appointments" className="text-sm text-muted-foreground hover:underline">
              All appointments
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments scheduled for today.</p>
          ) : (
            <div className="flex flex-col divide-y">
              {todayAppointments.map((appt) => (
                <div key={appt.id} className="py-3 flex items-center gap-3">
                  <span className="w-14 shrink-0 text-sm tabular-nums text-muted-foreground">
                    {formatTime(appt.scheduledAt)}
                  </span>
                  <span className="flex-1 text-sm font-medium">{appt.patientName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[appt.status] ?? ""}`}>
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
