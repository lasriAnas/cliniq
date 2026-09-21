"use client";

import { useMemo, useState } from "react";
import { PatientDetailDialog } from "@/components/patients/patient-detail-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OptionCombobox } from "@/components/option-combobox";
import { AppointmentStatusSelect } from "@/components/appointments/appointment-status-select";
import { AppointmentNotesDialog } from "@/components/appointments/appointment-notes-dialog";
import { DiagnosisDialog } from "@/components/appointments/diagnosis-dialog";
import { canEditAppointmentNotes } from "@/lib/can-edit-appointment-notes";
import { toCsv, downloadCsv } from "@/lib/csv";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export type AppointmentRow = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes: string | null;
  diagnosis: string | null;
};

const ALL_DOCTORS = "ALL";
const PAGE_SIZE = 20;

export function AppointmentsTable({
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
  const [search, setSearch] = useState("");
  const [doctorId, setDoctorId] = useState(ALL_DOCTORS);
  const [date, setDate] = useState("");
  const [dateKey, setDateKey] = useState(0);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);

  const doctorOptions = [{ id: ALL_DOCTORS, name: "All doctors" }, ...doctors.map((d) => ({ id: d.id, name: `Dr. ${d.name}` }))];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data
      .filter((row) => !q || row.patientName.toLowerCase().includes(q))
      .filter((row) => doctorId === ALL_DOCTORS || row.doctorId === doctorId)
      .filter((row) => !date || row.scheduledAt.slice(0, 10) === date)
      .sort((a, b) =>
        sortAsc
          ? a.scheduledAt.localeCompare(b.scheduledAt)
          : b.scheduledAt.localeCompare(a.scheduledAt),
      );
  }, [data, search, doctorId, date, sortAsc]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function resetPage() { setPage(0); }

  function handleExport() {
    const rows = filtered.map((appt) => ({
      Patient: appt.patientName,
      Doctor: `Dr. ${appt.doctorName}`,
      "Scheduled at": new Date(appt.scheduledAt).toLocaleString(),
      Status: appt.status,
    }));
    downloadCsv(
      "appointments.csv",
      toCsv(rows, ["Patient", "Doctor", "Scheduled at", "Status"]),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input
          placeholder="Search patient..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          className="w-full sm:w-44"
        />
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <label className="text-sm text-muted-foreground">Doctor</label>
          <OptionCombobox
            options={doctorOptions}
            value={doctorId}
            onChange={(value) => { setDoctorId(value || ALL_DOCTORS); resetPage(); }}
            placeholder="Search for a doctor..."
            className="w-full sm:w-48"
          />
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <label className="text-sm text-muted-foreground">Date</label>
          <input
            key={dateKey}
            type="date"
            defaultValue=""
            onChange={(e) => { setDate(e.target.value); resetPage(); }}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        {(search || doctorId !== ALL_DOCTORS || date) && (
          <button
            type="button"
            className="text-sm text-muted-foreground underline"
            onClick={() => {
              setSearch("");
              setDoctorId(ALL_DOCTORS);
              setDate("");
              setDateKey((k) => k + 1);
            }}
          >
            Clear filters
          </button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={handleExport}
        >
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1"
                  onClick={() => setSortAsc((v) => !v)}
                >
                  Scheduled at {sortAsc ? "↑" : "↓"}
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10">Notes</TableHead>
              <TableHead className="w-10">Diagnosis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No appointments match these filters.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell>
                    <PatientDetailDialog patientId={appt.patientId} className="underline">
                      {appt.patientName}
                    </PatientDetailDialog>
                  </TableCell>
                  <TableCell>Dr. {appt.doctorName}</TableCell>
                  <TableCell>{new Date(appt.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <AppointmentStatusSelect appointmentId={appt.id} status={appt.status} />
                  </TableCell>
                  <TableCell>
                    <AppointmentNotesDialog
                      appointmentId={appt.id}
                      initialNotes={appt.notes}
                      canEdit={canEditAppointmentNotes(currentRole, currentProfileId, appt.doctorId)}
                    />
                  </TableCell>
                  <TableCell>
                    <DiagnosisDialog
                      appointmentId={appt.id}
                      initialDiagnosis={appt.diagnosis}
                      canEdit={canEditAppointmentNotes(currentRole, currentProfileId, appt.doctorId)}
                      isCompleted={appt.status === "COMPLETED"}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page + 1} of {pageCount}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pageCount - 1}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
