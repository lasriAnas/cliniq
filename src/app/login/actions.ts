"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const userId = data.user.id;

  // Staff — has a Profile record
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (profile) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  // Patient — has a linked Patient record
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (patient) {
    revalidatePath("/", "layout");
    redirect("/portal");
  }

  // Auth user exists but no linked record — sign out and error
  await supabase.auth.signOut();
  redirect(`/login?error=${encodeURIComponent("No account found for these credentials.")}`);
}
