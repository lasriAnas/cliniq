"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { prescriptionItemSchema, type PrescriptionItemFormValues } from "@/lib/schemas/prescription";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  getOrCreatePrescription,
  addPrescriptionItem,
  removePrescriptionItem,
} from "@/app/dashboard/pharmacy/actions";

type PrescriptionItem = {
  id: string;
  medicationName: string;
  dosage: string;
  duration: string;
  notes: string | null;
};

type Prescription = {
  id: string;
  items: PrescriptionItem[];
};

const EMPTY_FORM = { medicationName: "", dosage: "", duration: "", notes: "" };

export function PrescriptionCreateDialog({
  appointmentId,
  existingCount,
  onSuccess,
}: {
  appointmentId: string;
  existingCount: number;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PrescriptionItemFormValues>({
    resolver: zodResolver(prescriptionItemSchema),
    mode: "onChange",
    defaultValues: EMPTY_FORM,
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    setLoadError(null);
    setAddError(null);
    if (next && !prescription) {
      startTransition(async () => {
        try {
          const rx = await getOrCreatePrescription(appointmentId);
          setPrescription(rx);
        } catch {
          setLoadError("Failed to load prescription.");
        }
      });
    }
    if (!next) {
      onSuccess?.();
    }
  }

  function onSubmit(values: PrescriptionItemFormValues) {
    if (!prescription) return;
    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v) formData.set(k, v);
    });
    setAddError(null);
    startTransition(async () => {
      try {
        await addPrescriptionItem(prescription.id, formData);
        const rx = await getOrCreatePrescription(appointmentId);
        setPrescription(rx);
        form.reset(EMPTY_FORM);
      } catch (err) {
        setAddError(err instanceof Error ? err.message : "Failed to add item");
      }
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      await removePrescriptionItem(itemId);
      const rx = await getOrCreatePrescription(appointmentId);
      setPrescription(rx);
    });
  }

  const label = existingCount > 0 ? `Edit prescription (${existingCount})` : "+ Prescribe";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm">{label}</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Prescription</DialogTitle>
        </DialogHeader>

        {loadError && <p className="text-sm text-destructive">{loadError}</p>}

        {isPending && !prescription ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : prescription ? (
          <div className="flex flex-col gap-4">
            {/* Current items */}
            {prescription.items.length > 0 && (
              <div className="flex flex-col gap-2">
                {prescription.items.map((item, i) => (
                  <div key={item.id} className="flex items-start justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {i + 1}. {item.medicationName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.dosage} · {item.duration}
                      </span>
                      {item.notes && (
                        <span className="text-xs text-muted-foreground italic">{item.notes}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                      disabled={isPending}
                      onClick={() => handleRemove(item.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <Separator />
              </div>
            )}

            {/* Add item form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
                <div className="text-sm font-medium text-muted-foreground">Add medication</div>
                <FormField
                  control={form.control}
                  name="medicationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Amoxicillin 500mg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dosage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dosage</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 1 tablet twice daily" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 7 days" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Notes{" "}
                        <span className="font-normal text-muted-foreground">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g. Take with food" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {addError && <p className="text-sm text-destructive">{addError}</p>}
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isPending || !form.formState.isValid}
                >
                  {isPending ? "Adding..." : "Add to prescription"}
                </Button>
              </form>
            </Form>

            <Separator />
            <Button
              type="button"
              disabled={prescription.items.length === 0}
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
