import { redirect } from "next/navigation";

import { PanelShell } from "@/components/panel/shell";
import { createClient } from "@/utils/supabase/server";

import { salir } from "./actions";

export const dynamic = "force-dynamic";

const ETIQUETA_ROL: Record<string, string> = {
  administracion: "Administración del conjunto",
  porteria: "Portería",
  residente: "Residente",
  admin: "Admin",
};

type Conjunto = { nombre: string; ciudad: string | null };

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, conjunto_id, unidad_id, nombres, email")
    .eq("id", user.id)
    .maybeSingle();

  // El Admin de plataforma no opera dentro del conjunto: tiene su propia área.
  if (perfil?.rol === "admin") redirect("/admin");

  let conjunto: Conjunto | null = null;
  let unidades = 0;

  if (perfil?.conjunto_id) {
    const [{ data }, { count }] = await Promise.all([
      supabase
        .from("conjuntos")
        .select("nombre, ciudad")
        .eq("id", perfil.conjunto_id)
        .maybeSingle(),
      supabase.from("unidades").select("*", { count: "exact", head: true }),
    ]);

    conjunto = data ?? null;
    unidades = count ?? 0;
  }

  const nombre = perfil?.nombres || user.email || "Usuario";
  const rol = perfil?.rol ? (ETIQUETA_ROL[perfil.rol] ?? perfil.rol) : "Sin rol";

  return (
    <PanelShell
      conjunto={{
        nombre: conjunto?.nombre ?? "Sin conjunto asignado",
        ciudad: conjunto?.ciudad ?? null,
        unidades,
      }}
      usuario={{ nombre, email: user.email ?? null, rol }}
      salir={salir}
    >
      {children}
    </PanelShell>
  );
}
