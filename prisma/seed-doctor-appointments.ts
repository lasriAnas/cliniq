/**
 * Seeds completed appointments with diagnoses for every doctor.
 * Run: npx tsx prisma/seed-doctor-appointments.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CASES: {
  diagnosis: string;
  notes: string;
  daysAgo: number;
  hour: number;
  invoiceAmount: number;
  prescription?: { medicationName: string; dosage: string; duration: string; notes?: string }[];
}[] = [
  {
    daysAgo: 5, hour: 9,
    diagnosis: "Type 2 diabetes mellitus — poorly controlled. HbA1c 9.2%, fasting glucose 14 mmol/L.",
    notes: "S: Patient reports increased thirst, frequent urination, fatigue for 3 weeks. Non-compliant with diet.\nO: BP 138/88, BMI 31. HbA1c 9.2%, FBG 14 mmol/L.\nA: Poorly controlled T2DM with early signs of metabolic syndrome.\nP: Initiate Metformin 1000 mg BD, dietary referral, repeat HbA1c in 3 months.",
    invoiceAmount: 350,
    prescription: [
      { medicationName: "Metformin", dosage: "1000 mg twice daily", duration: "3 months", notes: "Take with meals" },
      { medicationName: "Aspirin", dosage: "100 mg once daily", duration: "Ongoing" },
    ],
  },
  {
    daysAgo: 8, hour: 11,
    diagnosis: "Community-acquired pneumonia — mild to moderate severity.",
    notes: "S: 4-day history of productive cough, fever 38.9°C, mild dyspnea.\nO: RR 22, SpO2 95%, CXR: right lower lobe consolidation.\nA: CAP, CURB-65 score 1 — outpatient management appropriate.\nP: Amoxicillin 1g TDS x 7 days, rest, return if worsening.",
    invoiceAmount: 280,
    prescription: [
      { medicationName: "Amoxicillin", dosage: "1000 mg three times daily", duration: "7 days" },
      { medicationName: "Paracetamol", dosage: "1000 mg every 6 hours as needed", duration: "5 days" },
    ],
  },
  {
    daysAgo: 12, hour: 14,
    diagnosis: "Essential hypertension — uncontrolled. Target organ damage not yet detected.",
    notes: "S: Known hypertensive, off medication for 2 months. Headache and dizziness.\nO: BP 172/104 (repeated x2), HR 88, ECG normal.\nA: Uncontrolled stage 2 hypertension.\nP: Restart Amlodipine 10 mg OD, low-sodium diet, 2-week follow-up.",
    invoiceAmount: 200,
    prescription: [
      { medicationName: "Amlodipine", dosage: "10 mg once daily", duration: "Ongoing", notes: "Monitor BP twice weekly" },
    ],
  },
  {
    daysAgo: 6, hour: 10,
    diagnosis: "Iron deficiency anaemia — moderate severity (Hb 8.4 g/dL).",
    notes: "S: Fatigue, pallor, exertional breathlessness for 6 weeks. Heavy menstrual cycles.\nO: Pale conjunctiva, Hb 8.4, MCV 68, ferritin 4 ng/mL.\nA: Moderate IDA secondary to menorrhagia.\nP: Ferrous sulfate 200 mg BD x 3 months, gynaecology referral, repeat CBC in 6 weeks.",
    invoiceAmount: 250,
    prescription: [
      { medicationName: "Ferrous Sulfate", dosage: "200 mg twice daily", duration: "3 months", notes: "Take 1 hour before meals" },
      { medicationName: "Vitamin C", dosage: "500 mg once daily", duration: "3 months", notes: "Take with iron tablet to improve absorption" },
    ],
  },
  {
    daysAgo: 3, hour: 9,
    diagnosis: "Acute exacerbation of allergic rhinitis with conjunctivitis.",
    notes: "S: Sneezing, itchy eyes, nasal congestion. Seasonal — worse outdoors.\nO: Pale nasal mucosa, watery rhinorrhea, bilateral conjunctival injection.\nA: Allergic rhinoconjunctivitis, seasonal.\nP: Cetirizine 10 mg OD, fluticasone nasal spray, avoid allergen triggers.",
    invoiceAmount: 180,
    prescription: [
      { medicationName: "Cetirizine", dosage: "10 mg once daily", duration: "2 weeks" },
      { medicationName: "Fluticasone nasal spray", dosage: "2 sprays per nostril daily", duration: "2 weeks" },
    ],
  },
  {
    daysAgo: 10, hour: 15,
    diagnosis: "Gastroesophageal reflux disease (GERD) — moderate, without complications.",
    notes: "S: Heartburn after meals, regurgitation, worse at night for 2 months. Smokes 10 cigs/day.\nO: Epigastric tenderness on palpation, no dysphagia.\nA: Clinical GERD, lifestyle and pharmacological management indicated.\nP: Omeprazole 20 mg OD before breakfast, dietary advice (avoid spicy/fatty foods, elevate head of bed), smoking cessation.",
    invoiceAmount: 220,
    prescription: [
      { medicationName: "Omeprazole", dosage: "20 mg once daily before breakfast", duration: "8 weeks" },
    ],
  },
  {
    daysAgo: 4, hour: 11,
    diagnosis: "Lumbar disc herniation (L4-L5) — acute phase with radiculopathy.",
    notes: "S: Sudden onset low back pain radiating to left leg after lifting. Paresthesia in left foot.\nO: Positive straight leg raise at 40°, reduced L4 dermatomal sensation, MRI L4-L5 disc herniation confirmed.\nA: Acute lumbar disc herniation with L4 radiculopathy.\nP: NSAIDs, physiotherapy referral, neurosurgery consult if no improvement in 6 weeks.",
    invoiceAmount: 450,
    prescription: [
      { medicationName: "Ibuprofen", dosage: "400 mg three times daily with food", duration: "2 weeks" },
      { medicationName: "Diazepam", dosage: "5 mg at night", duration: "5 days", notes: "For muscle spasm only" },
    ],
  },
  {
    daysAgo: 15, hour: 8,
    diagnosis: "Generalized anxiety disorder (GAD) — moderate severity.",
    notes: "S: Persistent worry, difficulty sleeping, muscle tension for 4 months. GAD-7 score 14.\nO: Anxious affect, HR 98, otherwise unremarkable physical exam.\nA: GAD — pharmacotherapy and CBT referral warranted.\nP: Sertraline 50 mg OD (titrate to 100 mg after 2 weeks), psychology referral for CBT, review in 4 weeks.",
    invoiceAmount: 300,
    prescription: [
      { medicationName: "Sertraline", dosage: "50 mg once daily (increase to 100 mg after 2 weeks)", duration: "3 months", notes: "Take in the morning with food" },
    ],
  },
  {
    daysAgo: 7, hour: 13,
    diagnosis: "Urinary tract infection (UTI) — uncomplicated, lower tract.",
    notes: "S: Dysuria, frequency, urgency for 2 days. No fever. No flank pain.\nO: Urine dipstick: nitrites positive, leukocytes 3+. MSU sent.\nA: Uncomplicated lower UTI.\nP: Trimethoprim 200 mg BD x 5 days, increase fluid intake, follow-up if not improved in 48h.",
    invoiceAmount: 160,
    prescription: [
      { medicationName: "Trimethoprim", dosage: "200 mg twice daily", duration: "5 days" },
    ],
  },
  {
    daysAgo: 2, hour: 16,
    diagnosis: "Migraine with aura — episodic, moderate frequency (3–4 attacks/month).",
    notes: "S: Unilateral throbbing headache preceded by visual aura (zigzag lines), nausea, photophobia. Monthly for 6 months.\nO: Neurological exam normal between attacks. No papilloedema.\nA: Migraine with visual aura — acute and preventive therapy warranted.\nP: Sumatriptan 50 mg at onset, Propranolol 40 mg BD for prevention, headache diary.",
    invoiceAmount: 260,
    prescription: [
      { medicationName: "Sumatriptan", dosage: "50 mg at migraine onset, repeat after 2h if needed", duration: "As needed" },
      { medicationName: "Propranolol", dosage: "40 mg twice daily", duration: "3 months", notes: "Do not stop abruptly" },
    ],
  },
  {
    daysAgo: 9, hour: 10,
    diagnosis: "Hypothyroidism — newly diagnosed (TSH 12.4 mIU/L, free T4 low).",
    notes: "S: Weight gain 8 kg over 4 months, fatigue, constipation, cold intolerance.\nO: Dry skin, bradycardia 56 bpm, TSH 12.4, free T4 0.6 ng/dL.\nA: Primary hypothyroidism.\nP: Levothyroxine 50 mcg OD fasting, recheck TFTs in 6 weeks, titrate to TSH 1–2.",
    invoiceAmount: 240,
    prescription: [
      { medicationName: "Levothyroxine", dosage: "50 mcg once daily, 30 minutes before breakfast", duration: "Ongoing", notes: "Avoid calcium/iron supplements within 4 hours" },
    ],
  },
  {
    daysAgo: 11, hour: 14,
    diagnosis: "Eczema (atopic dermatitis) — moderate flare, flexural distribution.",
    notes: "S: Itchy, weeping rash in elbow and knee creases for 1 week. Known atopic history.\nO: Erythematous, lichenified plaques bilateral antecubital/popliteal fossae. EASI score 16.\nA: Atopic dermatitis — moderate flare.\nP: Betamethasone cream OD for 2 weeks, emollient TDS, antihistamine at night for pruritus.",
    invoiceAmount: 190,
    prescription: [
      { medicationName: "Betamethasone cream", dosage: "Apply thinly once daily", duration: "2 weeks", notes: "Do not use on face" },
      { medicationName: "Loratadine", dosage: "10 mg once daily at night", duration: "2 weeks" },
    ],
  },
];

function subtractDays(days: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  const doctors = await prisma.profile.findMany({ where: { role: "DOCTOR" } });
  if (doctors.length === 0) { console.error("No doctors found — run main seed first."); process.exit(1); }

  const patients = await prisma.patient.findMany({ take: 20 });
  if (patients.length === 0) { console.error("No patients found — run main seed first."); process.exit(1); }

  let caseIdx = 0;
  for (const c of CASES) {
    const doctor = doctors[caseIdx % doctors.length];
    const patient = patients[caseIdx % patients.length];

    const appt = await prisma.appointment.create({
      data: {
        patientId:   patient.id,
        doctorId:    doctor.id,
        scheduledAt: subtractDays(c.daysAgo, c.hour),
        status:      "COMPLETED",
        notes:       c.notes,
        diagnosis:   c.diagnosis,
      },
    });

    await prisma.invoice.create({
      data: {
        appointmentId: appt.id,
        amount:        c.invoiceAmount,
        status:        "PAID",
        paidAt:        subtractDays(c.daysAgo, c.hour + 1),
      },
    });

    if (c.prescription) {
      const rx = await prisma.prescription.create({ data: { appointmentId: appt.id } });
      await prisma.prescriptionItem.createMany({
        data: c.prescription.map((item) => ({
          prescriptionId: rx.id,
          medicationName: item.medicationName,
          dosage:         item.dosage,
          duration:       item.duration,
          notes:          item.notes ?? null,
        })),
      });
    }

    console.log(`✓ [${doctor.name}] — ${c.diagnosis.substring(0, 60)}…`);
    caseIdx++;
  }

  console.log(`\nDone. ${CASES.length} appointments created across ${doctors.length} doctors.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
