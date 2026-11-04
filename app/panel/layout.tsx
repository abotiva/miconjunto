import { redirect } from "next/navigation";

import { PanelShell, type RolApp } from "@/components/panel/shell";
import { ETIQUETA_ROL, obtenerPerfil } from "@/utils/auth/perfil";
import { createClient } from "@/utils/supabase/server";

import { salir } from "./actions";

export const dynamic = "force-dynamic";

type Conjunto = {
  nombre: string;
  ciudad: string | null;
  telefono: string | null;
};

type Unidad = {
  identificador: string;
  torres: { nombre: string } | null;
};

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { user, perfil } = await obtenerPerfil();

  if (!user) redirect("/ingresar");

  // El Admin de plataforma no opera dentro del conjunto: tiene su propia área.
  if (perfil?.rol === "admin") redirect("/admin");

  let conjunto: Conjunto | null = null;
  let unidades = 0;
  let unidad: string | null = null;

  if (perfil?.conjunto_id) {
    const [conjuntoQ, unidadesQ, unidadQ] = await Promise.all([
      supabase
        .from("conjuntos")
        .select("nombre, ciudad, telefono")
        .eq("id", perfil.conjunto_id)
        .maybeSingle(),
      supabase.from("unidades").select("*", { count: "exact", head: true }),
      perfil.unidad_id
        ? supabase
            .from("unidades")
            .select("identificador, torres ( nombre )")
            .eq("id", perfil.unidad_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    conjunto = conjuntoQ.data ?? null;
    unidades = unidadesQ.count ?? 0;

    const propia = (unidadQ.data as unknown as Unidad | null) ?? null;
    if (propia) {
      unidad = propia.torres?.nombre
        ? `${propia.torres.nombre} · ${propia.identificador}`
        : propia.identificador;
    }
  }

  const rol: RolApp | null =
    perfil?.rol === "administracion"
      ? "administracion"
      : perfil?.rol === "porteria"
        ? "porteria"
        : perfil?.rol === "residente"
          ? "residente"
          : null;

  const nombre = perfil?.nombres || user.email || "Usuario";
  const etiquetaRol = perfil?.rol ? (ETIQUETA_ROL[perfil.rol] ?? perfil.rol) : "Sin rol";

  return (
    <PanelShell
      rol={rol}
      conjunto={{
        nombre: conjunto?.nombre ?? "Sin conjunto asignado",
        ciudad: conjunto?.ciudad ?? null,
        telefono: conjunto?.telefono ?? null,
        unidades,
        unidad,
      }}
      usuario={{ nombre, email: user.email ?? null, rol: etiquetaRol }}
      salir={salir}
    >
      {children}
    </PanelShell>
  );
}
