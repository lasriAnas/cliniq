"use client";

import { useMemo, useState } from "react";
import { PatientDetailDialog } from "@/components/patients/patient-detail-dialog";
import { ReceiptDialog } from "@/components/billing/receipt-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceStatusSelect } from "@/components/billing/invoice-status-select";
import { toCsv, downloadCsv } from "@/lib/csv";
import type { InvoiceStatus } from "@/generated/prisma/enums";

export type InvoiceRow = {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  scheduledAt: string;
  paidAt: string | null;
  amount: number;
  status: InvoiceStatus;
  createdAt: string;
  appointmentCompleted: boolean;
};

const ALL = "ALL";

export function BillingTable({ data }: { data: InvoiceRow[] }) {
  const [status, setStatus] = useState(ALL);
  const [doctor, setDoctor] = useState(ALL);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const doctorNames = useMemo(
    () => Array.from(new Set(data.map((r) => r.doctorName))).sort(),
    [data],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data
      .filter((row) => status === ALL || row.status === status)
      .filter((row) => doctor === ALL || row.doctorName === doctor)
      .filter((row) => !q || row.patientName.toLowerCase().includes(q))
      .sort((a, b) =>
        sortAsc
          ? a.createdAt.localeCompare(b.createdAt)
          : b.createdAt.localeCompare(a.createdAt),
      );
  }, [data, status, doctor, sortAsc]);

  function handleExport() {
    const rows = filtered.map((invoice) => ({
      Patient: invoice.patientName,
      Doctor: `Dr. ${invoice.doctorName}`,
      "Appointment date": new Date(invoice.scheduledAt).toLocaleString(),
      "Amount (MAD)": invoice.amount,
      "Created at": new Date(invoice.createdAt).toLocaleString(),
      Status: invoice.status,
    }));
    downloadCsv(
      "invoices.csv",
      toCsv(rows, [
        "Patient",
        "Doctor",
        "Appointment date",
        "Amount (MAD)",
        "Created at",
        "Status",
      ]),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input
          placeholder="Search patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-44"
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">Status</label>
          <Select
            items={{ [ALL]: "All statuses", UNPAID: "UNPAID", PAID: "PAID", CANCELLED: "CANCELLED" }}
            value={status}
            onValueChange={(value) => setStatus(value ?? ALL)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="UNPAID">UNPAID</SelectItem>
              <SelectItem value="PAID">PAID</SelectItem>
              <SelectItem value="CANCELLED">CANCELLED</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">Doctor</label>
          <Select
            items={{ [ALL]: "All doctors", ...Object.fromEntries(doctorNames.map((n) => [n, `Dr. ${n}`])) }}
            value={doctor}
            onValueChange={(value) => setDoctor(value ?? ALL)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All doctors</SelectItem>
              {doctorNames.map((n) => (
                <SelectItem key={n} value={n}>Dr. {n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(status !== ALL || doctor !== ALL || search) && (
          <button
            type="button"
            className="text-sm text-muted-foreground underline self-end mb-0.5"
            onClick={() => { setStatus(ALL); setDoctor(ALL); setSearch(""); }}
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
              <TableHead>Appointment date</TableHead>
              <TableHead>Amount (MAD)</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1"
                  onClick={() => setSortAsc((v) => !v)}
                >
                  Created at {sortAsc ? "↑" : "↓"}
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No invoices match these filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <PatientDetailDialog patientId={invoice.patientId} className="underline">
                      {invoice.patientName}
                    </PatientDetailDialog>
                  </TableCell>
                  <TableCell>Dr. {invoice.doctorName}</TableCell>
                  <TableCell>{new Date(invoice.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>{new Date(invoice.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <InvoiceStatusSelect
                      invoiceId={invoice.id}
                      status={invoice.status}
                      appointmentCompleted={invoice.appointmentCompleted}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.status === "PAID" && (
                      <ReceiptDialog
                        receipt={{
                          id: invoice.id,
                          patientName: invoice.patientName,
                          doctorName: invoice.doctorName,
                          scheduledAt: invoice.scheduledAt,
                          paidAt: invoice.paidAt,
                          amount: invoice.amount,
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
