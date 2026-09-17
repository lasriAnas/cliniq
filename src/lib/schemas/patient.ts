import { z } from "zod";

export const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^\d{10}$/, "Phone must be a 10-digit number (e.g. 0612345678)"),
  address: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type PatientFormValues = z.infer<typeof patientSchema>;
