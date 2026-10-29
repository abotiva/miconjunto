import { createClient } from "@/utils/supabase/server";

import { crearTorre, crearUnidad } from "./actions";

export const dynamic = "force-dynamic";

const TIPOS = [
  ["apartamento", "Apartamento"],
  ["casa", "Casa"],
  ["local", "Local"],
  ["parqueadero", "Parqueadero"],
  ["deposito", "Depósito"],
] as const;

const ERRORES: Record<string, string> = {
  identificador: "El identificador de la unidad es obligatorio.",
  coeficiente: "El coeficiente debe ser un número entre 0 y 100.",
  "23505": "Ya existe una unidad con ese identificador en la misma torre.",
  "torre-nombre": "La torre necesita un nombre.",
  "42501": "No tienes permisos para crear unidades en este conjunto.",
};

type Unidad = {
  id: string;
  identificador: string;
  tipo: string;
  coeficiente: number;
  area_m2: number | null;
  estado: string;
  torres: { nombre: string } | null;
};

export default async function UnidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("conjunto_id, rol")
    .eq("id", user!.id)
    .maybeSingle();

  const [{ data: unidades }, { data: torres }] = await Promise.all([
    supabase
      .from("unidades")
      .select("id, identificador, tipo, coeficiente, area_m2, estado, torres ( nombre )")
      .order("identificador"),
    supabase.from("torres").select("id, nombre").order("nombre"),
  ]);

  const lista = (unidades ?? []) as unknown as Unidad[];
  const totalCoeficiente = lista.reduce((s, u) => s + Number(u.coeficiente ?? 0), 0);
  const puedeEditar = perfil?.rol === "administracion";
  const mensajeError = params.error ? (ERRORES[params.error] ?? `No se pudo guardar (${params.error}).`) : null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#17375e]">Unidades</h1>
          <p className="mt-1 text-sm text-[#5b6b7c]">
            {lista.length} {lista.length === 1 ? "unidad registrada" : "unidades registradas"} ·{" "}
            coeficiente acumulado{" "}
            <span className="font-semibold text-[#1f2a36]">
              {totalCoeficiente.toFixed(4)} %
            </span>
          </p>
        </div>
      </div>

      {mensajeError ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {mensajeError}
        </p>
      ) : null}

      {params.ok ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {params.ok === "torre" ? "Torre creada." : "Unidad creada."}
        </p>
      ) : null}

      {puedeEditar ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <details className="rounded-xl border border-[#dce3ea] bg-white p-5">
            <summary className="cursor-pointer text-sm font-semibold text-[#17375e]">
              Nueva unidad
            </summary>
            <form action={crearUnidad} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label htmlFor="identificador" className="block text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]">
                    Identificador
                  </label>
                  <input
                    id="identificador"
                    name="identificador"
                    required
                    maxLength={20}
                    placeholder="Ej: 302 o Casa 14"
                    className="mt-1.5 w-full rounded-lg border border-[#dce3ea] px-3 py-2 text-sm outline-none focus:border-[#1f7a6b] focus:ring-2 focus:ring-[#1f7a6b]/20"
                  />
                </div>
                <div>
                  <label htmlFor="tipo" className="block text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]">
                    Tipo
                  </label>
                  <select
                    id="tipo"
                    name="tipo"
                    defaultValue="apartamento"
                    className="mt-1.5 w-full rounded-lg border border-[#dce3ea] px-3 py-2 text-sm"
                  >
                    {TIPOS.map(([valor, etiqueta]) => (
                      <option key={valor} value={valor}>{etiqueta}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="torre_id" className="block text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]">
                    Torre
                  </label>
                  <select
                    id="torre_id"
                    name="torre_id"
                    defaultValue=""
                    className="mt-1.5 w-full rounded-lg border border-[#dce3ea] px-3 py-2 text-sm"
                  >
                    <option value="">Sin torre</option>
                    {(torres ?? []).map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="coeficiente" className="block text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]">
                    Coeficiente (%)
                  </label>
                  <input
                    id="coeficiente"
                    name="coeficiente"
                    required
                    inputMode="decimal"
                    placeholder="0.5234"
                    className="mt-1.5 w-full rounded-lg border border-[#dce3ea] px-3 py-2 text-sm outline-none focus:border-[#1f7a6b] focus:ring-2 focus:ring-[#1f7a6b]/20"
                  />
                </div>
                <div>
                  <label htmlFor="area_m2" className="block text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]">
                    Área (m²)
                  </label>
                  <input
                    id="area_m2"
                    name="area_m2"
                    inputMode="decimal"
                    placeholder="Opcional"
                    className="mt-1.5 w-full rounded-lg border border-[#dce3ea] px-3 py-2 text-sm outline-none focus:border-[#1f7a6b] focus:ring-2 focus:ring-[#1f7a6b]/20"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#17375e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#122c4c]"
              >
                Guardar unidad
              </button>
            </form>
          </details>

          <details className="rounded-xl border border-[#dce3ea] bg-white p-5">
            <summary className="cursor-pointer text-sm font-semibold text-[#17375e]">
              Nueva torre
            </summary>
            <form action={crearTorre} className="mt-4 space-y-3">
              <div>
                <label htmlFor="nombre-torre" className="block text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]">
                  Nombre
                </label>
                <input
                  id="nombre-torre"
                  name="nombre"
                  required
                  maxLength={40}
                  placeholder="Ej: Torre A"
                  className="mt-1.5 w-full rounded-lg border border-[#dce3ea] px-3 py-2 text-sm outline-none focus:border-[#1f7a6b] focus:ring-2 focus:ring-[#1f7a6b]/20"
                />
              </div>
              <div>
                <label htmlFor="pisos" className="block text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]">
                  Pisos
                </label>
                <input
                  id="pisos"
                  name="pisos"
                  inputMode="numeric"
                  placeholder="Opcional"
                  className="mt-1.5 w-full rounded-lg border border-[#dce3ea] px-3 py-2 text-sm outline-none focus:border-[#1f7a6b] focus:ring-2 focus:ring-[#1f7a6b]/20"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg border border-[#17375e] px-4 py-2.5 text-sm font-semibold text-[#17375e] transition hover:bg-[#17375e] hover:text-white"
              >
                Guardar torre
              </button>
            </form>
          </details>
        </div>
      ) : null}

      {lista.length === 0 ? (
        <section className="rounded-xl border border-[#dce3ea] bg-white p-6">
          <h2 className="text-base font-semibold text-[#17375e]">
            Todavía no hay unidades
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#5b6b7c]">
            Crea las torres si el conjunto las tiene y después registra cada unidad con
            su coeficiente de copropiedad. Ese coeficiente es el que se usará para
            repartir la cuota de administración.
          </p>
        </section>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#dce3ea] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f7f9fb] text-xs uppercase tracking-wide text-[#5b6b7c]">
              <tr>
                <th className="px-4 py-3 font-semibold">Unidad</th>
                <th className="px-4 py-3 font-semibold">Torre</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 text-right font-semibold">Coeficiente</th>
                <th className="px-4 py-3 text-right font-semibold">Área</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f6]">
              {lista.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-semibold text-[#1f2a36]">{u.identificador}</td>
                  <td className="px-4 py-3 text-[#5b6b7c]">{u.torres?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 capitalize text-[#5b6b7c]">{u.tipo}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {Number(u.coeficiente).toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#5b6b7c]">
                    {u.area_m2 ? `${u.area_m2} m²` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.estado === "activo"
                          ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                          : "rounded-full bg-[#eef2f6] px-2.5 py-1 text-xs font-semibold text-[#5b6b7c]"
                      }
                    >
                      {u.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
