"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptionCombobox } from "@/components/option-combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppointmentStatusSelect } from "@/components/appointments/appointment-status-select";
import { AppointmentNotesDialog } from "@/components/appointments/appointment-notes-dialog";
import { DiagnosisDialog } from "@/components/appointments/diagnosis-dialog";
import { PatientDetailDialog } from "@/components/patients/patient-detail-dialog";
import { canEditAppointmentNotes } from "@/lib/can-edit-appointment-notes";
import type { AppointmentRow } from "@/components/appointments/appointments-table";

const STATUS_CHIP: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  CANCELLED: "bg-muted text-muted-foreground line-through",
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ALL_DOCTORS = "ALL";

function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function AppointmentsCalendar({
  data,
  doctors,
  currentProfileId,
  currentRole,
}: {
  data: AppointmentRow[];
  doctors: { id: string; name: string }[];
  currentProfileId: string;
  currentRole: string;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [doctorId, setDoctorId] = useState(ALL_DOCTORS);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const doctorOptions = [
    { id: ALL_DOCTORS, name: "All doctors" },
    ...doctors.map((d) => ({ id: d.id, name: `Dr. ${d.name}` })),
  ];

  const filtered = useMemo(
    () => data.filter((row) => doctorId === ALL_DOCTORS || row.doctorId === doctorId),
    [data, doctorId],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentRow[]>();
    for (const row of filtered) {
      const key = row.scheduledAt.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return map;
  }, [filtered]);

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Offset for Mon-start week: getDay() returns 0=Sun, convert to Mon=0
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }
  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  function openDay(key: string, appts: AppointmentRow[]) {
    if (appts.length === 0) return;
    setSelectedDay(key);
    setDialogOpen(true);
  }

  const selectedAppts = selectedDay
    ? (byDay.get(selectedDay) ?? []).slice().sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    : [];

  const selectedDate = selectedDay ? new Date(selectedDay + "T00:00:00") : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">Doctor</label>
          <OptionCombobox
            options={doctorOptions}
            value={doctorId}
            onChange={(v) => setDoctorId(v || ALL_DOCTORS)}
            placeholder="Filter by doctor…"
            className="w-48"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={prevMonth} title="Previous month">
            <ChevronLeft />
          </Button>
          <span className="min-w-40 text-center font-medium tabular-nums">
            {MONTHS[month]} {year}
          </span>
          <Button variant="outline" size="icon-sm" onClick={nextMonth} title="Next month">
            <ChevronRight />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-lg border overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {WEEK_DAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }, (_, i) => {
            const dayNum = i - startOffset + 1;
            const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
            const key = isCurrentMonth ? toDateKey(year, month, dayNum) : null;
            const appts = key ? (byDay.get(key) ?? []) : [];
            const isToday = key === todayKey;
            const clickable = appts.length > 0;

            return (
              <div
                key={i}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={
                  clickable && key
                    ? (e) => { if (e.key === "Enter" || e.key === " ") openDay(key, appts); }
                    : undefined
                }
                onClick={() => key && openDay(key, appts)}
                className={[
                  "min-h-24 p-1.5 border-b border-r",
                  "[&:nth-child(7n)]:border-r-0",
                  "last-of-type:border-b-0",
                  !isCurrentMonth ? "bg-muted/20" : "",
                  clickable ? "cursor-pointer hover:bg-accent/40 transition-colors focus:outline-none focus:bg-accent/40" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {isCurrentMonth && (
                  <>
                    <span
                      className={[
                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-foreground",
                      ].join(" ")}
                    >
                      {dayNum}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {appts.slice(0, 3).map((appt) => (
                        <div
                          key={appt.id}
                          className={`truncate rounded px-1 py-0.5 text-xs leading-tight ${STATUS_CHIP[appt.status] ?? ""}`}
                        >
                          {new Date(appt.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          {appt.patientName}
                        </div>
                      ))}
                      {appts.length > 3 && (
                        <span className="px-1 text-xs text-muted-foreground">
                          +{appts.length - 3} more
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-200 dark:bg-blue-900/60" />
          Scheduled
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-900/60" />
          Completed
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-muted" />
          Cancelled
        </span>
      </div>

      {/* Day detail dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
            {selectedAppts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments on this day.</p>
            ) : (
              selectedAppts.map((appt) => (
                <div key={appt.id} className="rounded-lg border p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <PatientDetailDialog patientId={appt.patientId} className="font-medium underline text-sm">
                        {appt.patientName}
                      </PatientDetailDialog>
                      <p className="text-xs text-muted-foreground">
                        Dr. {appt.doctorName}
                        {" · "}
                        {new Date(appt.scheduledAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <AppointmentStatusSelect appointmentId={appt.id} status={appt.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <AppointmentNotesDialog
                      appointmentId={appt.id}
                      initialNotes={appt.notes}
                      canEdit={canEditAppointmentNotes(currentRole, currentProfileId, appt.doctorId)}
                    />
                    <DiagnosisDialog
                      appointmentId={appt.id}
                      initialDiagnosis={appt.diagnosis}
                      canEdit={canEditAppointmentNotes(currentRole, currentProfileId, appt.doctorId)}
                      isCompleted={appt.status === "COMPLETED"}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
