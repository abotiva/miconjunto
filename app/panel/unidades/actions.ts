"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

type Perfil = { conjunto_id: string | null; rol: string | null };

async function contexto() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("conjunto_id, rol")
    .eq("id", user.id)
    .maybeSingle<Perfil>();

  if (!perfil?.conjunto_id) redirect("/panel");

  return { supabase, perfil, user };
}

export async function crearTorre(formData: FormData) {
  const { supabase, perfil } = await contexto();

  if (perfil.rol !== "administracion") redirect("/panel/unidades");

  const nombre = String(formData.get("nombre") ?? "").trim();
  const pisos = Number(formData.get("pisos") ?? 0);

  if (!nombre) {
    redirect("/panel/unidades?error=torre-nombre");
  }

  const { error } = await supabase.from("torres").insert({
    conjunto_id: perfil.conjunto_id,
    nombre,
    pisos: Number.isFinite(pisos) && pisos > 0 ? Math.trunc(pisos) : null,
  });

  if (error) {
    redirect(`/panel/unidades?error=${encodeURIComponent(error.code ?? "torre")}`);
  }

  revalidatePath("/panel/unidades");
  redirect("/panel/unidades?ok=torre");
}

export async function crearUnidad(formData: FormData) {
  const { supabase, perfil } = await contexto();

  if (perfil.rol !== "administracion") redirect("/panel/unidades");

  const identificador = String(formData.get("identificador") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "apartamento");
  const torreId = String(formData.get("torre_id") ?? "");
  const coeficiente = Number(String(formData.get("coeficiente") ?? "").replace(",", "."));
  const areaTexto = String(formData.get("area_m2") ?? "").replace(",", ".");
  const area = areaTexto === "" ? null : Number(areaTexto);

  if (!identificador) {
    redirect("/panel/unidades?error=identificador");
  }

  if (!Number.isFinite(coeficiente) || coeficiente < 0 || coeficiente > 100) {
    redirect("/panel/unidades?error=coeficiente");
  }

  const { error } = await supabase.from("unidades").insert({
    conjunto_id: perfil.conjunto_id,
    torre_id: torreId || null,
    identificador,
    tipo,
    coeficiente,
    area_m2: area !== null && Number.isFinite(area) ? area : null,
  });

  if (error) {
    // 23505 = identificador repetido en la misma torre
    redirect(`/panel/unidades?error=${encodeURIComponent(error.code ?? "unidad")}`);
  }

  revalidatePath("/panel/unidades");
  redirect("/panel/unidades?ok=unidad");
}
