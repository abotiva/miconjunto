"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export type EstadoIngreso = { error: string };

export async function ingresar(
  _previo: EstadoIngreso,
  formData: FormData,
): Promise<EstadoIngreso> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Escribe tu correo y tu contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      return { error: "Correo o contraseña incorrectos." };
    }
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Tu correo aún no está confirmado. Pídele a la administración que lo confirme." };
    }
    return { error: error.message };
  }

  redirect("/panel");
}
