import { IconoEdificio, IconoMas } from "@/components/icons";
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

const CAMPO =
  "mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-[#9aa8b6] focus:border-teal focus:ring-2 focus:ring-teal/20";
const ETIQUETA =
  "block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted";
const BOTON_PRIMARIO =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal px-4 text-[12px] font-semibold text-white transition hover:bg-teal-dark";
const BOTON_SECUNDARIO =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-[12px] font-semibold text-navy transition hover:border-teal hover:text-teal";

type Unidad = {
  id: string;
  identificador: string;
  tipo: string;
  coeficiente: number;
  area_m2: number | null;
  estado: string;
  torres: { nombre: string } | null;
};

function Estado({ estado }: { estado: string }) {
  const activa = estado === "activo";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        activa ? "bg-mint text-teal" : "bg-canvas text-muted"
      }`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {activa ? "Activa" : "Inactiva"}
    </span>
  );
}

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
  const mensajeError = params.error
    ? (ERRORES[params.error] ?? `No se pudo guardar (${params.error}).`)
    : null;

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] text-[#90a1ac]">
          MiConjunto <span className="mx-1 opacity-50">/</span>
          <span className="font-semibold text-teal">Unidades</span>
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.6px] text-navy">
              Unidades
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              {lista.length === 0
                ? "Sin unidades registradas todavía"
                : `${lista.length} ${
                    lista.length === 1 ? "unidad registrada" : "unidades registradas"
                  } · coeficiente acumulado `}
              {lista.length > 0 ? (
                <span className="font-semibold text-ink">
                  {totalCoeficiente.toFixed(4)} %
                </span>
              ) : null}
            </p>
          </div>

          {puedeEditar ? (
            <span className="hidden items-center gap-1.5 text-[11px] text-muted sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" />
              Coeficiente de copropiedad
            </span>
          ) : null}
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
        <p className="mb-4 rounded-lg border border-teal/20 bg-mint px-3 py-2 text-sm text-teal">
          {params.ok === "torre" ? "Torre creada." : "Unidad creada."}
        </p>
      ) : null}

      {puedeEditar ? (
        <div className="mb-4 grid gap-4 lg:grid-cols-2">
          <details className="group rounded-xl border border-line bg-surface">
            <summary className="flex cursor-pointer items-center gap-3 px-5 py-4">
              <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-mint text-teal">
                <IconoMas className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-navy">Nueva unidad</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Identificador, tipo, torre y coeficiente
                </p>
              </div>
              <span className="ml-auto whitespace-nowrap text-[11px] font-semibold text-teal group-open:hidden">
                Abrir
              </span>
              <span className="ml-auto hidden whitespace-nowrap text-[11px] font-semibold text-muted group-open:inline">
                Cerrar
              </span>
            </summary>

            <form
              action={crearUnidad}
              className="border-t border-line-soft px-5 pb-5 pt-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="identificador" className={ETIQUETA}>
                    Identificador
                  </label>
                  <input
                    id="identificador"
                    name="identificador"
                    required
                    maxLength={20}
                    placeholder="Ej: 302 o Casa 14"
                    className={CAMPO}
                  />
                </div>
                <div>
                  <label htmlFor="tipo" className={ETIQUETA}>
                    Tipo
                  </label>
                  <select id="tipo" name="tipo" defaultValue="apartamento" className={CAMPO}>
                    {TIPOS.map(([valor, etiqueta]) => (
                      <option key={valor} value={valor}>
                        {etiqueta}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="torre_id" className={ETIQUETA}>
                    Torre
                  </label>
                  <select id="torre_id" name="torre_id" defaultValue="" className={CAMPO}>
                    <option value="">Sin torre</option>
                    {(torres ?? []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="coeficiente" className={ETIQUETA}>
                    Coeficiente (%)
                  </label>
                  <input
                    id="coeficiente"
                    name="coeficiente"
                    required
                    inputMode="decimal"
                    placeholder="0.5234"
                    className={CAMPO}
                  />
                </div>
                <div>
                  <label htmlFor="area_m2" className={ETIQUETA}>
                    Área (m²)
                  </label>
                  <input
                    id="area_m2"
                    name="area_m2"
                    inputMode="decimal"
                    placeholder="Opcional"
                    className={CAMPO}
                  />
                </div>
              </div>

              <button type="submit" className={`${BOTON_PRIMARIO} mt-4`}>
                Guardar unidad
              </button>
            </form>
          </details>

          <details className="group rounded-xl border border-line bg-surface">
            <summary className="flex cursor-pointer items-center gap-3 px-5 py-4">
              <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-mint text-teal">
                <IconoEdificio className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-navy">Nueva torre</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Agrupa las unidades por bloque o edificio
                </p>
              </div>
              <span className="ml-auto whitespace-nowrap text-[11px] font-semibold text-teal group-open:hidden">
                Abrir
              </span>
              <span className="ml-auto hidden whitespace-nowrap text-[11px] font-semibold text-muted group-open:inline">
                Cerrar
              </span>
            </summary>

            <form
              action={crearTorre}
              className="border-t border-line-soft px-5 pb-5 pt-4"
            >
              <div>
                <label htmlFor="nombre-torre" className={ETIQUETA}>
                  Nombre
                </label>
                <input
                  id="nombre-torre"
                  name="nombre"
                  required
                  maxLength={40}
                  placeholder="Ej: Torre A"
                  className={CAMPO}
                />
              </div>
              <div className="mt-3">
                <label htmlFor="pisos" className={ETIQUETA}>
                  Pisos
                </label>
                <input
                  id="pisos"
                  name="pisos"
                  inputMode="numeric"
                  placeholder="Opcional"
                  className={CAMPO}
                />
              </div>
              <button type="submit" className={`${BOTON_SECUNDARIO} mt-4`}>
                Guardar torre
              </button>
            </form>
          </details>
        </div>
      ) : null}

      {lista.length === 0 ? (
        <section className="rounded-xl border border-dashed border-line bg-surface p-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-mint text-teal">
            <IconoEdificio className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-[16px] font-semibold text-navy">
            Todavía no hay unidades
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">
            Crea las torres si el conjunto las tiene y después registra cada unidad
            con su coeficiente de copropiedad. Ese coeficiente es el que se usará
            para repartir la cuota de administración.
          </p>
          {puedeEditar ? (
            <p className="mt-3 text-[11px] text-muted">
              Usa «Nueva unidad» para empezar.
            </p>
          ) : null}
        </section>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line-soft bg-[#fbfcfd] text-[10px] uppercase tracking-[0.1em] text-[#8a9ba7]">
                  <th className="px-5 py-2.5 font-semibold">Unidad</th>
                  <th className="px-5 py-2.5 font-semibold">Torre</th>
                  <th className="px-5 py-2.5 font-semibold">Tipo</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Coeficiente</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Área</th>
                  <th className="px-5 py-2.5 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="leading-snug">
                {lista.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-line-soft transition last:border-0 hover:bg-canvas/60"
                  >
                    <td className="px-5 py-2.5 text-[12px] font-semibold text-navy">
                      {u.identificador}
                    </td>
                    <td className="px-5 py-2.5 text-[12px] text-[#3e5563]">
                      {u.torres?.nombre ?? "—"}
                    </td>
                    <td className="px-5 py-2.5 text-[12px] capitalize text-[#3e5563]">
                      {u.tipo}
                    </td>
                    <td className="px-5 py-2.5 text-right text-[12px] tabular-nums text-muted">
                      {Number(u.coeficiente).toFixed(4)} %
                    </td>
                    <td className="px-5 py-2.5 text-right text-[12px] tabular-nums text-muted">
                      {u.area_m2 ? `${Number(u.area_m2)} m²` : "—"}
                    </td>
                    <td className="px-5 py-2.5">
                      <Estado estado={u.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-5 py-2.5 text-[11px] text-muted">
            <span>
              {lista.length} {lista.length === 1 ? "unidad" : "unidades"}
            </span>
            <span>
              Coeficiente acumulado{" "}
              <span className="font-semibold text-ink">
                {totalCoeficiente.toFixed(4)} %
              </span>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
