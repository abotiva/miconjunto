"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

/**
 * Abre un acceso de soporte: temporal, con motivo y caducidad.
 * La RLS solo permite insertar al propio Admin (admin_id = auth.uid()).
 */
export async function abrirAcceso(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const conjuntoId = String(formData.get("conjunto_id") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();
  const horas = Number(formData.get("horas") ?? 4);

  if (!conjuntoId || motivo.length < 10) {
    redirect("/admin?error=motivo");
  }

  const horasSeguras = Math.min(24, Math.max(1, Number.isFinite(horas) ? horas : 4));

  const { error } = await supabase.from("accesos_soporte").insert({
    admin_id: user.id,
    conjunto_id: conjuntoId,
    motivo,
    hasta: new Date(Date.now() + horasSeguras * 3600 * 1000).toISOString(),
  });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.code ?? "insert")}`);
  }

  revalidatePath("/admin");
  redirect("/admin");
}

/** Cierra un acceso antes de su caducidad. Queda registrado, no se borra. */
export async function revocarAcceso(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin");

  await supabase
    .from("accesos_soporte")
    .update({ revocado_en: new Date().toISOString() })
    .eq("id", id)
    .eq("admin_id", user.id);

  revalidatePath("/admin");
  redirect("/admin");
}
