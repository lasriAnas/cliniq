"use client";

import { useTransition, useRef } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OptionCombobox } from "@/components/option-combobox";
import { portalBookAppointment } from "@/app/portal/(auth)/appointments/actions";
import { useState } from "react";

export function PortalBookingForm({ doctors }: { doctors: { id: string; name: string }[] }) {
  const [doctorId, setDoctorId] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const doctorOptions = doctors.map((d) => ({ id: d.id, name: `Dr. ${d.name}` }));

  function handleSubmit(formData: FormData) {
    if (!doctorId) {
      toast.error("Please select a doctor.");
      return;
    }
    formData.set("doctorId", doctorId);

    startTransition(async () => {
      try {
        await portalBookAppointment(formData);
        toast.success("Appointment booked successfully.");
        setDoctorId("");
        formRef.current?.reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to book appointment.");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1.5 min-w-48">
        <Label>Doctor</Label>
        <OptionCombobox
          options={doctorOptions}
          value={doctorId}
          onChange={(v) => setDoctorId(v)}
          placeholder="Select a doctor…"
          className="w-56"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="scheduledAt">Date &amp; time</Label>
        <Input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          required
          className="w-52"
        />
      </div>
      <Button type="submit" disabled={isPending || !doctorId}>
        {isPending ? "Booking…" : "Book appointment"}
      </Button>
    </form>
  );
}
