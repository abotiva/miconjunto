import { createClient } from "@/utils/supabase/server";

import { abrirAcceso, revocarAcceso } from "./actions";

export const dynamic = "force-dynamic";

const formato = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#17375e]">Conjuntos</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#5b6b7c]">
          Como Admin puedes ver la estructura y crear conjuntos, pero los datos de
          cada conjunto solo se abren con un acceso de soporte vigente.
        </p>
      </div>

      {!conjuntos || conjuntos.length === 0 ? (
        <section className="rounded-xl border border-[#dce3ea] bg-white p-6">
          <h2 className="text-base font-semibold text-[#17375e]">
            Todavía no hay conjuntos
          </h2>
          <p className="mt-2 text-sm text-[#5b6b7c]">
            El primero se crea con el script de datos iniciales o desde esta misma
            área cuando exista el formulario.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {conjuntos.map((c) => {
            const activo = lista.find((a) => a.conjunto_id === c.id && vigente(a, ahora));
            return (
              <article
                key={c.id}
                className="rounded-xl border border-[#dce3ea] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-[#17375e]">
                      {c.nombre}
                    </h2>
                    <p className="mt-1 text-xs text-[#5b6b7c]">
                      {c.ciudad || "Sin ciudad"} · creado el{" "}
                      {formato.format(new Date(c.creado_en))}
                    </p>
                  </div>

                  {activo ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Acceso activo hasta {formato.format(new Date(activo.hasta))}
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#eef2f6] px-3 py-1 text-xs font-semibold text-[#5b6b7c]">
                      Sin acceso a datos
                    </span>
                  )}
                </div>

                {activo ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f6] pt-4">
                    <p className="text-xs text-[#5b6b7c]">
                      Motivo: <span className="text-[#1f2a36]">{activo.motivo}</span>
                    </p>
                    <form action={revocarAcceso}>
                      <input type="hidden" name="id" value={activo.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-[#dce3ea] px-3 py-2 text-xs font-semibold text-[#5b6b7c] transition hover:border-[#17375e] hover:text-[#17375e]"
                      >
                        Cerrar acceso
                      </button>
                    </form>
                  </div>
                ) : (
                  <details className="mt-4 border-t border-[#eef2f6] pt-4">
                    <summary className="cursor-pointer text-xs font-semibold text-[#1f7a6b]">
                      Abrir acceso de soporte
                    </summary>
                    <form action={abrirAcceso} className="mt-3 space-y-3">
                      <input type="hidden" name="conjunto_id" value={c.id} />
                      <div>
                        <label
                          htmlFor={`motivo-${c.id}`}
                          className="block text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]"
                        >
                          Motivo (lo verá la Administración del conjunto)
                        </label>
                        <input
                          id={`motivo-${c.id}`}
                          name="motivo"
                          required
                          minLength={10}
                          maxLength={300}
                          placeholder="Ej: revisar por qué no carga la lista de unidades"
                          className="mt-1.5 w-full rounded-lg border border-[#dce3ea] px-3 py-2 text-sm outline-none focus:border-[#1f7a6b] focus:ring-2 focus:ring-[#1f7a6b]/20"
                        />
                      </div>
                      <div className="flex items-end gap-3">
                        <div>
                          <label
                            htmlFor={`horas-${c.id}`}
                            className="block text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]"
                          >
                            Duración
                          </label>
                          <select
                            id={`horas-${c.id}`}
                            name="horas"
                            defaultValue="4"
                            className="mt-1.5 rounded-lg border border-[#dce3ea] px-3 py-2 text-sm"
                          >
                            <option value="1">1 hora</option>
                            <option value="4">4 horas</option>
                            <option value="8">8 horas</option>
                            <option value="24">24 horas</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          className="rounded-lg bg-[#17375e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#122c4c]"
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5b6b7c]">
          Mis accesos recientes
        </h2>
        {lista.length === 0 ? (
          <p className="mt-3 text-sm text-[#5b6b7c]">
            Todavía no has abierto ningún acceso.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-[#dce3ea] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f7f9fb] text-xs uppercase tracking-wide text-[#5b6b7c]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Conjunto</th>
                  <th className="px-4 py-3 font-semibold">Motivo</th>
                  <th className="px-4 py-3 font-semibold">Desde</th>
                  <th className="px-4 py-3 font-semibold">Hasta</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f6]">
                {lista.map((a) => {
                  const conjunto = conjuntos?.find((c) => c.id === a.conjunto_id);
                  const estado = a.revocado_en
                    ? "Cerrado"
                    : vigente(a, ahora)
                      ? "Vigente"
                      : "Vencido";
                  return (
                    <tr key={a.id}>
                      <td className="px-4 py-3">{conjunto?.nombre ?? "—"}</td>
                      <td className="px-4 py-3 text-[#5b6b7c]">{a.motivo}</td>
                      <td className="px-4 py-3 text-[#5b6b7c]">
                        {formato.format(new Date(a.desde))}
                      </td>
                      <td className="px-4 py-3 text-[#5b6b7c]">
                        {formato.format(new Date(a.hasta))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            estado === "Vigente"
                              ? "font-semibold text-emerald-700"
                              : "text-[#5b6b7c]"
                          }
                        >
                          {estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
