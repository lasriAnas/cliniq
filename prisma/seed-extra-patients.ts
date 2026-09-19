/**
 * Adds extra patients with upcoming appointments (staff-side data only).
 * Run: npx tsx prisma/seed-extra-patients.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PATIENTS = [
  {
    name: "Amina Bouazza",
    dob: "1994-03-08",
    gender: "FEMALE" as const,
    phone: "0612345601",
    address: "14 Rue Al Mansour, Rabat",
    appointments: [
      { daysFromNow: 2,  hour: 9,  notes: "First prenatal visit. Patient is 10 weeks pregnant." },
      { daysFromNow: 30, hour: 10, notes: "Second prenatal follow-up." },
    ],
  },
  {
    name: "Karim Berrada",
    dob: "1971-11-22",
    gender: "MALE" as const,
    phone: "0623456702",
    address: "7 Blvd Mohammed VI, Casablanca",
    appointments: [
      { daysFromNow: 3,  hour: 11, notes: "Diabetic review. HbA1c check due." },
      { daysFromNow: 90, hour: 14, notes: "Quarterly diabetic check-up." },
    ],
  },
  {
    name: "Nadia El Fassi",
    dob: "1988-07-14",
    gender: "FEMALE" as const,
    phone: "0634567803",
    address: "22 Ave des FAR, Marrakech",
    appointments: [
      { daysFromNow: 5, hour: 15, notes: "Chronic back pain follow-up. Physiotherapy referral pending." },
    ],
  },
  {
    name: "Youssef Tahiri",
    dob: "1956-01-30",
    gender: "MALE" as const,
    phone: "0645678904",
    address: "3 Derb Sidi Bouloukate, Fès",
    appointments: [
      { daysFromNow: 7,  hour: 9,  notes: "Post-surgical check-up — knee replacement 6 weeks ago." },
      { daysFromNow: 21, hour: 10, notes: "Physiotherapy progress review." },
      { daysFromNow: 60, hour: 11, notes: "3-month orthopaedic follow-up." },
    ],
  },
  {
    name: "Salma Rhazali",
    dob: "2001-05-19",
    gender: "FEMALE" as const,
    phone: "0656789005",
    address: "9 Hay Riad, Rabat",
    appointments: [
      { daysFromNow: 1,  hour: 16, notes: "Anxiety and stress management consultation." },
      { daysFromNow: 14, hour: 16, notes: "Mental health follow-up." },
    ],
  },
  {
    name: "Rachid Lahlou",
    dob: "1965-09-03",
    gender: "MALE" as const,
    phone: "0667890106",
    address: "31 Quartier Palmier, Casablanca",
    appointments: [
      { daysFromNow: 4,  hour: 8,  notes: "Hypertension medication adjustment. BP logged at 158/95 last visit." },
    ],
  },
  {
    name: "Hajar Bennani",
    dob: "1999-12-25",
    gender: "FEMALE" as const,
    phone: "0678901207",
    address: "5 Rue Ibnou Khatib, Agadir",
    appointments: [
      { daysFromNow: 10, hour: 13, notes: "Routine annual check-up." },
    ],
  },
  {
    name: "Omar Sefrioui",
    dob: "1980-04-17",
    gender: "MALE" as const,
    phone: "0689012308",
    address: "18 Rue de la Liberté, Tanger",
    appointments: [
      { daysFromNow: 6,  hour: 10, notes: "Respiratory review — persistent cough 3 weeks." },
      { daysFromNow: 20, hour: 11, notes: "Chest X-ray results review." },
    ],
  },
];

function addDays(date: Date, days: number, hour: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  const today = new Date();

  const doctors = await prisma.profile.findMany({ where: { role: "DOCTOR" } });
  if (doctors.length === 0) {
    console.error("No doctors found — run the main seed first.");
    process.exit(1);
  }

  let doctorIndex = 0;
  const nextDoctor = () => doctors[doctorIndex++ % doctors.length];

  for (const p of PATIENTS) {
    // Delete existing record with same name (idempotent)
    await prisma.patient.deleteMany({ where: { name: p.name, userId: null } });

    const patient = await prisma.patient.create({
      data: {
        name:    p.name,
        dob:     new Date(p.dob),
        gender:  p.gender,
        phone:   p.phone,
        address: p.address,
      },
    });

    for (const appt of p.appointments) {
      await prisma.appointment.create({
        data: {
          patientId:   patient.id,
          doctorId:    nextDoctor().id,
          scheduledAt: addDays(today, appt.daysFromNow, appt.hour),
          status:      "SCHEDULED",
          notes:       appt.notes,
        },
      });
    }

    console.log(`✓ ${p.name} — ${p.appointments.length} appointment(s)`);
  }

  console.log("\nDone. 8 patients added.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
