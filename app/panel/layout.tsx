import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

import { salir } from "./actions";

export const dynamic = "force-dynamic";

const ETIQUETA_ROL: Record<string, string> = {
  administracion: "Administración del conjunto",
  porteria: "Portería",
  residente: "Residente",
  admin: "Admin",
};

const NAV = [
  { href: "/panel", label: "Panel", listo: true },
  { href: "/panel/unidades", label: "Unidades", listo: true },
  { href: "/panel/porteria", label: "Portería", listo: false },
  { href: "/panel/reservas", label: "Reservas", listo: false },
  { href: "/panel/pqrs", label: "PQRS", listo: false },
  { href: "/panel/comunicados", label: "Comunicados", listo: false },
  { href: "/panel/auditoria", label: "Auditoría", listo: true },
];

type Conjunto = { id: string; nombre: string; ciudad: string | null };

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

  if (perfil?.conjunto_id) {
    const { data } = await supabase
      .from("conjuntos")
      .select("id, nombre, ciudad")
      .eq("id", perfil.conjunto_id)
      .maybeSingle();
    conjunto = data ?? null;
  }

  const nombre = perfil?.nombres || user.email || "Usuario";
  const rol = perfil?.rol ? (ETIQUETA_ROL[perfil.rol] ?? perfil.rol) : "Sin rol";

  return (
    <div className="min-h-screen bg-[#f6f8fa]">
      <header className="border-b border-[#dce3ea] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1f7a6b]">
              MiConjunto
            </p>
            <p className="truncate text-sm font-semibold text-[#17375e]">
              {conjunto?.nombre ?? "Sin conjunto asignado"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="truncate text-sm text-[#1f2a36]">{nombre}</p>
              <p className="text-xs text-[#5b6b7c]">{rol}</p>
            </div>
            <form action={salir}>
              <button
                type="submit"
                className="rounded-lg border border-[#dce3ea] px-3 py-2 text-xs font-semibold text-[#5b6b7c] transition hover:border-[#17375e] hover:text-[#17375e]"
              >
                Salir
              </button>
            </form>
          </div>
        </div>

        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((item) =>
            item.listo ? (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-[#17375e]"
                aria-current="page"
              >
                {item.label}
              </a>
            ) : (
              <span
                key={item.href}
                className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-[#9aa8b6]"
                title="Disponible en la siguiente fase"
              >
                {item.label}
                <span className="rounded bg-[#eef2f6] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a99a8]">
                  pronto
                </span>
              </span>
            ),
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
