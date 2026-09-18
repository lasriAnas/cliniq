"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medicationSchema, type MedicationFormValues } from "@/lib/schemas/medication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MedicationForm({
  action,
  onSuccess,
}: {
  action: (formData: FormData) => Promise<unknown>;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    mode: "onChange",
    defaultValues: { name: "", unit: "", stock: "0", reorderThreshold: "10", category: "MEDICATION" },
  });

  const category = form.watch("category");

  function onSubmit(values: MedicationFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value)));
    startTransition(async () => {
      await action(formData);
      form.reset();
      onSuccess?.();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                items={{ MEDICATION: "Medication", SUPPLY: "Supply / consumable" }}
                value={field.value}
                onValueChange={(v) => field.onChange(v ?? "MEDICATION")}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MEDICATION">Medication</SelectItem>
                  <SelectItem value="SUPPLY">Supply / consumable</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder={category === "SUPPLY" ? "e.g. Latex gloves (L)" : "e.g. Amoxicillin 500mg"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <FormControl>
                <Input
                  placeholder={category === "SUPPLY" ? "e.g. pair, box, tube" : "e.g. tablet, ml, vial"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial stock</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reorderThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder threshold</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isPending || !form.formState.isValid}>
          {isPending ? "Adding..." : `Add ${category === "SUPPLY" ? "supply" : "medication"}`}
        </Button>
      </form>
    </Form>
  );
}
