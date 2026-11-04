import { redirect } from "next/navigation";

import { IconoEscudo } from "@/components/icons";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const formato = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

type Acceso = {
  id: string;
  motivo: string;
  desde: string;
  hasta: string;
  revocado_en: string | null;
  perfiles: { nombres: string | null; email: string | null } | null;
};

export default async function AuditoriaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("conjunto_id, rol")
    .eq("id", user!.id)
    .maybeSingle();

  // La auditoría es parte del gobierno del conjunto, no de la operación.
  if (perfil?.rol !== "administracion") redirect("/panel");

  const { data, error } = await supabase
    .from("accesos_soporte")
    .select("id, motivo, desde, hasta, revocado_en, perfiles ( nombres, email )")
    .eq("conjunto_id", perfil?.conjunto_id ?? "")
    .order("desde", { ascending: false })
    .limit(50);

  const accesos = (data ?? []) as unknown as Acceso[];
  const ahora = Date.now();

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] text-[#90a1ac]">
          MiConjunto <span className="mx-1 opacity-50">/</span>
          <span className="font-semibold text-teal">Auditoría</span>
        </p>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.6px] text-navy">
          Accesos de soporte
        </h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">
          Cada vez que el equipo de MiConjunto necesita revisar datos del conjunto,
          debe abrir un acceso temporal con un motivo escrito. Aquí queda el
          registro completo: quién entró, cuándo, por qué y hasta cuándo.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          No se pudo cargar la auditoría: {error.message}
        </p>
      ) : accesos.length === 0 ? (
        <section className="rounded-xl border border-line bg-surface p-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-mint text-teal">
            <IconoEscudo className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-[16px] font-semibold text-navy">
            Ningún acceso registrado
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">
            Nadie del equipo de la plataforma ha abierto un acceso a los datos de
            este conjunto.
          </p>
        </section>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line-soft bg-[#fbfcfd] text-[10px] uppercase tracking-[0.1em] text-[#8a9ba7]">
                  <th className="px-5 py-2.5 font-semibold">Quién</th>
                  <th className="px-5 py-2.5 font-semibold">Motivo</th>
                  <th className="px-5 py-2.5 font-semibold">Desde</th>
                  <th className="px-5 py-2.5 font-semibold">Hasta</th>
                  <th className="px-5 py-2.5 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="leading-snug">
                {accesos.map((a) => {
                  const vigente =
                    !a.revocado_en && new Date(a.hasta).getTime() > ahora;
                  const estado = a.revocado_en
                    ? "Cerrado antes de tiempo"
                    : vigente
                      ? "Vigente"
                      : "Vencido";

                  return (
                    <tr
                      key={a.id}
                      className="border-b border-line-soft transition last:border-0 hover:bg-canvas/60"
                    >
                      <td className="px-5 py-2.5 text-[12px] font-medium text-navy">
                        {a.perfiles?.nombres ||
                          a.perfiles?.email ||
                          "Equipo de soporte"}
                      </td>
                      <td className="max-w-[320px] px-5 py-2.5 text-[12px] leading-relaxed text-[#3e5563]">
                        {a.motivo}
                      </td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-[12px] tabular-nums text-muted">
                        {formato.format(new Date(a.desde))}
                      </td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-[12px] tabular-nums text-muted">
                        {formato.format(new Date(a.hasta))}
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            vigente
                              ? "bg-mint text-teal"
                              : estado === "Cerrado antes de tiempo"
                                ? "bg-[#fff3e4] text-[#b26a18]"
                                : "bg-canvas text-muted"
                          }`}
                        >
                          <span className="h-1 w-1 rounded-full bg-current" />
                          {estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-line-soft px-5 py-2.5 text-[11px] text-muted">
            {accesos.length} {accesos.length === 1 ? "acceso registrado" : "accesos registrados"}
          </div>
        </div>
      )}
    </>
  );
}
