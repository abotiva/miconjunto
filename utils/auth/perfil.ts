import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/server";

export type Rol = "administracion" | "porteria" | "residente" | "admin";

export type Perfil = {
  id: string;
  rol: Rol;
  conjunto_id: string | null;
  unidad_id: string | null;
  nombres: string | null;
  email: string | null;
};

export const ETIQUETA_ROL: Record<Rol, string> = {
  administracion: "Administración del conjunto",
  porteria: "Portería",
  residente: "Residente",
  admin: "Admin",
};

/**
 * Lee la sesión y el perfil en una sola pasada. No redirige: cada pantalla
 * decide qué hacer con un usuario sin perfil o sin conjunto asignado.
 */
export async function obtenerPerfil(): Promise<{
  user: User | null;
  perfil: Perfil | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, perfil: null };

  const { data } = await supabase
    .from("perfiles")
    .select("id, rol, conjunto_id, unidad_id, nombres, email")
    .eq("id", user.id)
    .maybeSingle();

  return { user, perfil: (data as Perfil | null) ?? null };
}

/**
 * Guarda de ruta: exige sesión y uno de los roles indicados. El Admin de
 * plataforma nunca opera dentro del conjunto y el resto vuelve a su inicio.
 */
export async function exigirRol(roles: Rol[]) {
  const { user, perfil } = await obtenerPerfil();

  if (!user) redirect("/ingresar");
  if (perfil?.rol === "admin") redirect("/admin");
  if (!perfil || !roles.includes(perfil.rol)) redirect("/panel");

  return { user, perfil };
}
