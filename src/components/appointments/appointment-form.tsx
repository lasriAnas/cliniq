"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema, type AppointmentFormValues } from "@/lib/schemas/appointment";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OptionCombobox } from "@/components/option-combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Option = { id: string; name: string };

export function AppointmentForm({
  action,
  patients,
  doctors,
  onSuccess,
}: {
  action: (formData: FormData) => Promise<unknown>;
  patients: Option[];
  doctors: Option[];
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const doctorOptions = doctors.map((d) => ({ id: d.id, name: `Dr. ${d.name}` }));

  // Computed after mount only — using `new Date()` during render would differ
  // between the server-rendered HTML and the client hydration pass.
  const [minDateTime, setMinDateTime] = useState<string | undefined>(undefined);
  useEffect(() => {
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only value, set after mount to avoid SSR/client mismatch
    setMinDateTime(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  }, []);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    mode: "onChange",
    defaultValues: { patientId: "", doctorId: "", scheduledAt: "", notes: "" },
  });

  function onSubmit(values: AppointmentFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value) formData.set(key, value);
    });
    startTransition(async () => {
      await action(formData);
      form.reset();
      onSuccess?.();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-md">
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient</FormLabel>
              <FormControl>
                <OptionCombobox
                  options={patients}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Search for a patient..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="doctorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doctor</FormLabel>
              <FormControl>
                <OptionCombobox
                  options={doctorOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Search for a doctor..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="scheduledAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date and time</FormLabel>
              <FormControl>
                <input
                  type="datetime-local"
                  name={field.name}
                  ref={field.ref}
                  defaultValue={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending || !form.formState.isValid}>
          {isPending ? "Scheduling..." : "Schedule appointment"}
        </Button>
      </form>
    </Form>
  );
}
