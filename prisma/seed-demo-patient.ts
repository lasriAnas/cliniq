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
      notes: "Patient says he has been feeling exhausted for the past three weeks, even after a full night of sleep. He also mentioned his heart feels like it is racing when he climbs stairs and he gets out of breath faster than usual. He has not changed his diet or lifestyle recently. No chest pain.",
      diagnosis: "Iron deficiency anaemia",
      invoice: { amount: 350, status: "PAID" as const, paidAt: new Date("2026-07-10") },
      prescription: [
        { medicationName: "Ferrous Sulfate", dosage: "200 mg once daily", duration: "3 months", notes: "Take with food to reduce stomach upset" as string | undefined },
        { medicationName: "Vitamin C", dosage: "500 mg once daily", duration: "3 months", notes: "Take alongside iron to improve absorption" as string | undefined },
      ],
    },
    {
      scheduledAt: new Date("2026-08-05T11:00:00"),
      notes: "Patient reports his energy has improved since starting iron supplements but he has been getting headaches almost every afternoon, usually at the back of his head. He checks his blood pressure at the pharmacy and it reads around 150 over 95. He feels stressed at work and has been sleeping poorly. No dizziness or vision changes.",
      diagnosis: "Stage 1 hypertension",
      invoice: { amount: 280, status: "PAID" as const, paidAt: new Date("2026-08-05") },
      prescription: [
        { medicationName: "Amlodipine", dosage: "5 mg once daily", duration: "Ongoing", notes: "Monitor blood pressure weekly and log readings" as string | undefined },
      ],
    },
    {
      scheduledAt: new Date("2026-09-01T14:30:00"),
      notes: "Patient complains of persistent sneezing for the past ten days, especially in the morning. His eyes are itchy and watery, and his nose is blocked at night which is disrupting his sleep. He says it started after he spent time outdoors near the construction site near his home. No fever. He tried an over-the-counter antihistamine once but it made him very drowsy.",
      diagnosis: "Allergic rhinitis",
      invoice: { amount: 200, status: "UNPAID" as const, paidAt: null },
      prescription: [
        { medicationName: "Cetirizine", dosage: "10 mg once daily", duration: "2 weeks", notes: "Take in the evening to minimise drowsiness" as string | undefined },
        { medicationName: "Fluticasone nasal spray", dosage: "2 sprays per nostril once daily", duration: "2 weeks", notes: "Use each morning before going outside" as string | undefined },
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
      notes: "Patient would like to review his blood pressure readings over the past month. He says the headaches are less frequent but still present. He is also asking about whether he needs to continue the iron supplements or whether blood work should be repeated.",
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
