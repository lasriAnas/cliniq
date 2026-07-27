import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentPatient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  return patient ?? null;
}

export async function requirePatient() {
  const patient = await getCurrentPatient();
  if (!patient) throw new Error("Not authenticated as a patient.");
  return patient;
}
