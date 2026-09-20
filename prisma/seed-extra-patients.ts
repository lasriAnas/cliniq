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
      { daysFromNow: 2,  hour: 9,  notes: "Patient says she confirmed her pregnancy two weeks ago at home and this is her first visit to a doctor. She is approximately 10 weeks along based on her last period. She has been experiencing nausea every morning and occasional vomiting around midday. She is very tired and says she can barely stay awake past 8pm. No bleeding or cramping. She has many questions about what to eat and what to avoid." },
      { daysFromNow: 7,  hour: 11, notes: "Patient mentions she has been having headaches almost daily since her last visit and feels a pressure behind her eyes. She measured her blood pressure at the pharmacy and it read 142 over 90. She is worried and asks if this is normal in pregnancy. She has been trying to rest more but the headaches are affecting her sleep." },
      { daysFromNow: 30, hour: 10, notes: "Second prenatal follow-up. Patient says nausea has improved significantly and she is eating better now. She is still tired but says it is more manageable. She is feeling occasional kicks and is excited but anxious about her upcoming anatomy scan." },
    ],
  },
  {
    name: "Karim Berrada",
    dob: "1971-11-22",
    gender: "MALE" as const,
    phone: "0623456702",
    address: "7 Blvd Mohammed VI, Casablanca",
    appointments: [
      { daysFromNow: 3,  hour: 9,  notes: "Patient says he has been feeling very thirsty over the past two months, waking up at night to drink water and urinate multiple times. He notices his vision seems blurry sometimes especially in the afternoons. He has gained about 5 kg over the past six months and says he eats a lot of sweet things. His father had diabetes. He has not had any blood work in over two years." },
      { daysFromNow: 90, hour: 14, notes: "Quarterly diabetic check-up. Patient to bring home glucose log and report on how well he is adhering to the low-carbohydrate meal plan discussed at previous visit." },
    ],
  },
  {
    name: "Nadia El Fassi",
    dob: "1988-07-14",
    gender: "FEMALE" as const,
    phone: "0634567803",
    address: "22 Ave des FAR, Marrakech",
    appointments: [
      { daysFromNow: 3,  hour: 11, notes: "Patient describes a sharp, stabbing pain in her lower back on the left side that started after she moved furniture at home about six weeks ago. The pain radiates down her left leg to her knee. She rates the pain as 7 out of 10. It is worse in the morning and after sitting for long periods. She says ibuprofen helps a little but the relief does not last. She cannot bend forward without significant pain." },
      { daysFromNow: 17, hour: 14, notes: "Physiotherapy progress review. Patient to report on exercises prescribed and whether leg radiation has reduced. She mentioned during booking call that she had two sessions and felt slightly better after the second." },
    ],
  },
  {
    name: "Youssef Tahiri",
    dob: "1956-01-30",
    gender: "MALE" as const,
    phone: "0645678904",
    address: "3 Derb Sidi Bouloukate, Fès",
    appointments: [
      { daysFromNow: 7,  hour: 9,  notes: "Post-operative check-up six weeks after total left knee replacement. Patient says the wound looks healed but the knee is still quite swollen and stiff. He can walk about 50 metres with a crutch before the pain becomes too intense. He rates resting pain as 3 out of 10 and walking pain as 6 out of 10. He is attending physiotherapy twice a week. He is worried that his recovery is slower than expected." },
      { daysFromNow: 21, hour: 10, notes: "Physiotherapy progress review. Patient has been doing daily exercises at home. He will bring his physiotherapy progress notes to share." },
      { daysFromNow: 60, hour: 11, notes: "Three-month orthopaedic follow-up. Full range-of-motion assessment and weight-bearing X-ray planned." },
    ],
  },
  {
    name: "Salma Rhazali",
    dob: "2001-05-19",
    gender: "FEMALE" as const,
    phone: "0656789005",
    address: "9 Hay Riad, Rabat",
    appointments: [
      { daysFromNow: 2,  hour: 14, notes: "Patient says she has been feeling overwhelmed and anxious for the past four months, since she started her final year at university. She describes a constant feeling of dread and says her heart races before lectures and exams. She has difficulty concentrating and sometimes feels like she cannot breathe properly. She wakes up between 3am and 4am most nights with her mind racing and cannot fall back asleep. She has been avoiding social situations and cancelled several plans with friends." },
      { daysFromNow: 14, hour: 16, notes: "Mental health follow-up. Patient booked this herself online. Said she wants to discuss whether she should try therapy or medication or both." },
    ],
  },
  {
    name: "Rachid Lahlou",
    dob: "1965-09-03",
    gender: "MALE" as const,
    phone: "0667890106",
    address: "31 Quartier Palmier, Casablanca",
    appointments: [
      { daysFromNow: 2,  hour: 16, notes: "Patient is currently on Amlodipine 5 mg daily but says his blood pressure readings at home are still running between 155 and 165 over 90 to 95. He is also complaining of swollen ankles over the past three weeks which he thinks is from the medication. He admits he sometimes forgets his evening dose and has been eating salty food. He is a smoker, approximately 15 cigarettes per day for 30 years, and says he is not ready to quit." },
      { daysFromNow: 30, hour: 9,  notes: "Blood pressure recheck following medication dose adjustment. Patient to bring home blood pressure diary." },
    ],
  },
  {
    name: "Hajar Bennani",
    dob: "1999-12-25",
    gender: "FEMALE" as const,
    phone: "0678901207",
    address: "5 Rue Ibnou Khatib, Agadir",
    appointments: [
      { daysFromNow: 7,  hour: 13, notes: "Routine annual check-up. Patient says she feels generally well but notices she gets cold very easily and her hair has been falling out more than usual for the past two months. She also feels more tired than she used to and says her mood has been low and flat. Her menstrual cycle has become irregular over the past three months. No significant past medical history. Family history of thyroid disease on her mother's side." },
      { daysFromNow: 7,  hour: 15, notes: "Gynaecology referral follow-up. Patient says her periods were very heavy last month with clots. She has had some mild pelvic discomfort between cycles." },
    ],
  },
  {
    name: "Omar Sefrioui",
    dob: "1980-04-17",
    gender: "MALE" as const,
    phone: "0689012308",
    address: "18 Rue de la Liberté, Tanger",
    appointments: [
      { daysFromNow: 3,  hour: 14, notes: "Patient reports a persistent dry cough that started about three weeks ago. It is worse at night and early in the morning and has been disrupting his sleep. He does not have a fever but feels slightly congested. He tried a cough syrup from the pharmacy but it did not help. He is a non-smoker. He works in a warehouse with dust exposure and recently the ventilation has not been working. He is also worried because his father had lung cancer." },
      { daysFromNow: 17, hour: 11, notes: "Chest X-ray results review. Imaging was ordered at previous visit. Patient to return for interpretation of findings." },
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
