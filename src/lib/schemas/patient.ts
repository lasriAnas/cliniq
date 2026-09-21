import { z } from "zod";

export const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(
      /^(?:(?:\+212|00212)[- ]?|0)[5-7]\d{8}$/,
      "Enter a valid Moroccan number (e.g. 0612345678 or +212612345678)",
    ),
  address: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type PatientFormValues = z.infer<typeof patientSchema>;
