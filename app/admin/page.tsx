import { IconoEdificio } from "@/components/icons";
import { createClient } from "@/utils/supabase/server";

import { abrirAcceso, revocarAcceso } from "./actions";

export const dynamic = "force-dynamic";

const formato = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

const CAMPO =
  "mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-[#9aa8b6] focus:border-teal focus:ring-2 focus:ring-teal/20";
const ETIQUETA =
  "block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted";

type Acceso = {
  id: string;
  conjunto_id: string;
  motivo: string;
  desde: string;
  hasta: string;
  revocado_en: string | null;
};

function vigente(a: Acceso, ahora: number) {
  return !a.revocado_en && new Date(a.hasta).getTime() > ahora;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: conjuntos }, { data: accesos }] = await Promise.all([
    supabase
      .from("conjuntos")
      .select("id, nombre, ciudad, creado_en")
      .order("nombre"),
    supabase
      .from("accesos_soporte")
      .select("id, conjunto_id, motivo, desde, hasta, revocado_en")
      .eq("admin_id", user!.id)
      .order("desde", { ascending: false })
      .limit(20),
  ]);

  const ahora = Date.now();
  const lista = (accesos ?? []) as Acceso[];

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] text-[#90a1ac]">Plataforma</p>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.6px] text-navy">
          Conjuntos
        </h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">
          Como Admin puedes ver la estructura y crear conjuntos, pero los datos de
          cada conjunto solo se abren con un acceso de soporte vigente.
        </p>
      </div>

      {!conjuntos || conjuntos.length === 0 ? (
        <section className="rounded-xl border border-line bg-surface p-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-mint text-teal">
            <IconoEdificio className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-[16px] font-semibold text-navy">
            Todavía no hay conjuntos
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">
            El primero se crea con el script de datos iniciales o desde esta misma
            área cuando exista el formulario.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {conjuntos.map((c) => {
            const activo = lista.find(
              (a) => a.conjunto_id === c.id && vigente(a, ahora),
            );
            return (
              <article
                key={c.id}
                className="rounded-xl border border-line bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-mint text-teal">
                      <IconoEdificio className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-semibold text-navy">
                        {c.nombre}
                      </h2>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {c.ciudad || "Sin ciudad"} · creado el{" "}
                        {formato.format(new Date(c.creado_en))}
                      </p>
                    </div>
                  </div>

                  {activo ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-[11px] font-semibold text-teal">
                      <span className="h-1 w-1 rounded-full bg-current" />
                      Acceso activo hasta {formato.format(new Date(activo.hasta))}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1 text-[11px] font-semibold text-muted">
                      <span className="h-1 w-1 rounded-full bg-current" />
                      Sin acceso a datos
                    </span>
                  )}
                </div>

                {activo ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
                    <p className="max-w-xl text-[12px] leading-relaxed text-muted">
                      Motivo:{" "}
                      <span className="text-ink">{activo.motivo}</span>
                    </p>
                    <form action={revocarAcceso}>
                      <input type="hidden" name="id" value={activo.id} />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-[12px] font-semibold text-navy transition hover:border-navy"
                      >
                        Cerrar acceso
                      </button>
                    </form>
                  </div>
                ) : (
                  <details className="group mt-4 border-t border-line-soft pt-4">
                    <summary className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-teal">
                      <span className="text-[15px] leading-none">+</span>
                      Abrir acceso de soporte
                    </summary>
                    <form action={abrirAcceso} className="mt-3 space-y-3">
                      <input type="hidden" name="conjunto_id" value={c.id} />
                      <div>
                        <label htmlFor={`motivo-${c.id}`} className={ETIQUETA}>
                          Motivo (lo verá la Administración del conjunto)
                        </label>
                        <input
                          id={`motivo-${c.id}`}
                          name="motivo"
                          required
                          minLength={10}
                          maxLength={300}
                          placeholder="Ej: revisar por qué no carga la lista de unidades"
                          className={CAMPO}
                        />
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <label
                            htmlFor={`horas-${c.id}`}
                            className={ETIQUETA}
                          >
                            Duración
                          </label>
                          <select
                            id={`horas-${c.id}`}
                            name="horas"
                            defaultValue="4"
                            className={CAMPO}
                          >
                            <option value="1">1 hora</option>
                            <option value="4">4 horas</option>
                            <option value="8">8 horas</option>
                            <option value="24">24 horas</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center rounded-lg bg-teal px-4 text-[12px] font-semibold text-white transition hover:bg-teal-dark"
                        >
                          Abrir acceso
                        </button>
                      </div>
                    </form>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Mis accesos recientes
        </h2>

        {lista.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted">
            Todavía no has abierto ningún acceso.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line-soft bg-[#fbfcfd] text-[10px] uppercase tracking-[0.1em] text-[#8a9ba7]">
                    <th className="px-5 py-2.5 font-semibold">Conjunto</th>
                    <th className="px-5 py-2.5 font-semibold">Motivo</th>
                    <th className="px-5 py-2.5 font-semibold">Desde</th>
                    <th className="px-5 py-2.5 font-semibold">Hasta</th>
                    <th className="px-5 py-2.5 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="leading-snug">
                  {lista.map((a) => {
                    const conjunto = conjuntos?.find((c) => c.id === a.conjunto_id);
                    const abierto = vigente(a, ahora);
                    const estado = a.revocado_en
                      ? "Cerrado"
                      : abierto
                        ? "Vigente"
                        : "Vencido";

                    return (
                      <tr
                        key={a.id}
                        className="border-b border-line-soft transition last:border-0 hover:bg-canvas/60"
                      >
                        <td className="px-5 py-2.5 text-[12px] font-medium text-navy">
                          {conjunto?.nombre ?? "—"}
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
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              abierto
                                ? "bg-mint text-teal"
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
          </div>
        )}
      </section>
    </>
  );
}
