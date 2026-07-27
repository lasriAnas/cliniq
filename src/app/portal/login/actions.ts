"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function portalLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/portal/login?error=${encodeURIComponent(error.message)}`);
  }

  // Verify this user is actually a patient (has a linked Patient record)
  const patient = await prisma.patient.findUnique({ where: { userId: data.user.id } });
  if (!patient) {
    await supabase.auth.signOut();
    redirect(`/portal/login?error=${encodeURIComponent("No patient account found for these credentials.")}`);
  }

  revalidatePath("/", "layout");
  redirect("/portal");
}
