"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format-date";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";

export type ReceiptData = {
  id: string;
  patientName: string;
  doctorName: string;
  scheduledAt: string;
  paidAt: string | null;
  amount: number;
};

export function ReceiptDialog({ receipt }: { receipt: ReceiptData }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        View receipt
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <PrintButton />

          <div className="mx-auto w-full max-w-lg rounded-lg border p-8 print:border-none print:p-0">
            <div className="flex flex-col items-center gap-1 border-b pb-4 text-center">
              <div className="text-xl font-semibold">CliniQ</div>
              <div className="text-sm text-muted-foreground">Payment receipt</div>
            </div>

            <dl className="mt-6 flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Receipt no.</dt>
                <dd className="font-mono">{receipt.id.slice(0, 8).toUpperCase()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Patient</dt>
                <dd>{receipt.patientName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Doctor</dt>
                <dd>Dr. {receipt.doctorName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Appointment date</dt>
                <dd>{formatDateTime(receipt.scheduledAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Paid on</dt>
                <dd>{receipt.paidAt ? formatDateTime(receipt.paidAt) : "—"}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t pt-3 text-base font-semibold">
                <dt>Amount paid</dt>
                <dd>{receipt.amount.toLocaleString()} MAD</dd>
              </div>
            </dl>

            <div className="mt-8 text-center text-xs text-muted-foreground">
              Thank you. This receipt confirms payment was received in full.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
