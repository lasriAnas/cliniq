/**
 * Creates a single demo patient portal account with realistic data.
 * Run: npx tsx prisma/seed-demo-patient.ts
 *
 * Credentials:  patient@demo.com / password123
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const DEMO_EMAIL = "patient@demo.com";
const DEMO_PASSWORD = "password123";

async function main() {
  console.log("Creating demo patient account…");

  // 1. Create Supabase auth user (idempotent — delete first if exists)
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  const prev = existing.users.find((u) => u.email === DEMO_EMAIL);
  if (prev) {
    await supabaseAdmin.auth.admin.deleteUser(prev.id);
    console.log("  Removed previous demo auth user");
  }

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    console.error("Failed to create Supabase user:", authError?.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log("  Auth user created:", userId);

  // 2. Delete existing Patient record for this user (idempotent)
  await prisma.patient.deleteMany({ where: { email: DEMO_EMAIL } });

  // 3. Pick any doctor from the DB to attach appointments to
  const doctor = await prisma.profile.findFirst({
    where: { role: "DOCTOR" },
  });
  if (!doctor) {
    console.error("No doctor found — run the main seed first.");
    process.exit(1);
  }

  // 4. Create Patient record
  const patient = await prisma.patient.create({
    data: {
      name: "Demo Patient",
      email: DEMO_EMAIL,
      dob: new Date("1990-06-15"),
      gender: "MALE",
      phone: "0600000000",
      address: "1 Rue de la Démo, Casablanca",
      userId,
    },
  });
  console.log("  Patient record created:", patient.id);

  // 5. Past appointments (completed, each with invoice + prescription)
  const pastAppointments = [
    {
      scheduledAt: new Date("2026-07-10T09:00:00"),
      notes: "Routine check-up. Patient reports mild fatigue.",
      diagnosis: "Iron deficiency anaemia",
      invoice: { amount: 350, status: "PAID" as const, paidAt: new Date("2026-07-10") },
      prescription: [
        { medicationName: "Ferrous Sulfate", dosage: "200 mg once daily", duration: "3 months", notes: "Take with food" as string | undefined },
        { medicationName: "Vitamin C", dosage: "500 mg once daily", duration: "3 months", notes: undefined },
      ],
    },
    {
      scheduledAt: new Date("2026-08-05T11:00:00"),
      notes: "Follow-up. Energy levels improved. Blood pressure slightly elevated.",
      diagnosis: "Stage 1 hypertension",
      invoice: { amount: 280, status: "PAID" as const, paidAt: new Date("2026-08-05") },
      prescription: [
        { medicationName: "Amlodipine", dosage: "5 mg once daily", duration: "Ongoing", notes: "Monitor BP weekly" as string | undefined },
      ],
    },
    {
      scheduledAt: new Date("2026-09-01T14:30:00"),
      notes: "Seasonal allergy flare-up. Sneezing, itchy eyes.",
      diagnosis: "Allergic rhinitis",
      invoice: { amount: 200, status: "UNPAID" as const, paidAt: null },
      prescription: [
        { medicationName: "Cetirizine", dosage: "10 mg once daily", duration: "2 weeks", notes: undefined },
        { medicationName: "Fluticasone nasal spray", dosage: "2 sprays per nostril daily", duration: "2 weeks", notes: undefined },
      ],
    },
  ];

  for (const appt of pastAppointments) {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt: appt.scheduledAt,
        status: "COMPLETED",
        notes: appt.notes,
        diagnosis: appt.diagnosis,
      },
    });

    await prisma.invoice.create({
      data: {
        appointmentId: appointment.id,
        amount: appt.invoice.amount,
        status: appt.invoice.status,
        paidAt: appt.invoice.paidAt,
      },
    });

    const prescription = await prisma.prescription.create({
      data: { appointmentId: appointment.id },
    });

    await prisma.prescriptionItem.createMany({
      data: appt.prescription.map((item) => ({
        prescriptionId: prescription.id,
        medicationName: item.medicationName,
        dosage: item.dosage,
        duration: item.duration ?? "",
        notes: item.notes ?? null,
      })),
    });
  }

  // 6. Upcoming appointment (scheduled, no invoice/prescription yet)
  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: new Date("2026-10-14T10:00:00"),
      status: "SCHEDULED",
      notes: "Hypertension follow-up and routine blood work review.",
    },
  });

  console.log("  3 completed appointments + 1 upcoming created");
  console.log("\nDone! Portal login:");
  console.log("  Email:    patient@demo.com");
  console.log("  Password: password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
