import { z } from "zod";

export const portalBookingSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  scheduledAt: z
    .string()
    .min(1, "Date and time is required")
    .refine((value) => !isNaN(new Date(value).getTime()), {
      message: "Invalid date",
    })
    .refine((value) => new Date(value) > new Date(), {
      message: "Appointment must be in the future",
    }),
});

export type PortalBookingValues = z.infer<typeof portalBookingSchema>;
