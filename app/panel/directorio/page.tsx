import Link from "next/link";

import { IconoBuscar, IconoEdificio, IconoUsuarios, IconoVehiculo } from "@/components/icons";
import { exigirRol } from "@/utils/auth/perfil";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type UnidadRef = {
  identificador: string;
  torres: { nombre: string } | null;
};

type Persona = {
  id: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  documento: string;
  telefono: string | null;
  vinculaciones: {
    rol: string;
    activo: boolean;
    unidades: UnidadRef | null;
  }[];
};

type Unidad = {
  id: string;
  identificador: string;
  tipo: string;
  estado: string;
  torres: { nombre: string } | null;
};

type Vehiculo = {
  id: string;
  placa: string;
  tipo: string;
  marca: string | null;
  color: string | null;
  unidades: UnidadRef | null;
};

const NOMBRE_TIPO: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  local: "Local",
  parqueadero: "Parqueadero",
  deposito: "Depósito",
};

const NOMBRE_ROL: Record<string, string> = {
  propietario: "Propietario",
  residente: "Residente",
  arrendatario: "Arrendatario",
  autorizado: "Autorizado",
};

function etiquetaUnidad(unidad: UnidadRef | null) {
  if (!unidad) return "Sin unidad";
  return unidad.torres?.nombre
    ? `${unidad.torres.nombre} · ${unidad.identificador}`
    : unidad.identificador;
}

export default async function DirectorioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { perfil } = await exigirRol(["administracion", "porteria"]);
  const esPorteria = perfil.rol === "porteria";

  const params = await searchParams;
  const consulta = (params.q ?? "").trim();
  const filtro = consulta.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
  const supabase = await createClient();

  const personasQ = supabase
    .from("personas")
    .select(
      "id, nombres, apellidos, tipo_documento, documento, telefono, vinculaciones ( rol, activo, unidades ( identificador, torres ( nombre ) ) )",
    )
    .order("nombres")
    .limit(25);

  const unidadesQ = supabase
    .from("unidades")
    .select("id, identificador, tipo, estado, torres ( nombre )")
    .order("identificador")
    .limit(25);

  const vehiculosQ = supabase
    .from("vehiculos")
    .select("id, placa, tipo, marca, color, unidades ( identificador, torres ( nombre ) )")
    .order("placa")
    .limit(25);

  if (filtro) {
    personasQ.or(
      `nombres.ilike.%${filtro}%,apellidos.ilike.%${filtro}%,documento.ilike.%${filtro}%`,
    );
    unidadesQ.ilike("identificador", `%${filtro}%`);
    vehiculosQ.or(`placa.ilike.%${filtro}%,marca.ilike.%${filtro}%`);
  }

  const [personasR, unidadesR, vehiculosR] = await Promise.all([
    personasQ,
    unidadesQ,
    vehiculosQ,
  ]);

  const personas = (personasR.data ?? []) as unknown as Persona[];
  const unidades = (unidadesR.data ?? []) as unknown as Unidad[];
  const vehiculos = (vehiculosR.data ?? []) as unknown as Vehiculo[];

  const total = personas.length + unidades.length + vehiculos.length;

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] text-muted">
          {esPorteria ? "Portería" : "Gestión"} <span className="mx-1 opacity-50">/</span>
          <span className="font-semibold text-teal">Directorio</span>
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.6px] text-navy">
              Directorio del conjunto
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Busca por unidad, placa o documento
            </p>
          </div>

          <Link
            href="/panel"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-4 text-[12px] font-semibold text-navy transition hover:border-teal hover:text-teal"
          >
            {esPorteria ? "Volver al turno" : "Volver al panel"}
          </Link>
        </div>
      </div>

      <form action="/panel/directorio" className="mb-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <IconoBuscar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              name="q"
              type="search"
              defaultValue={consulta}
              placeholder="B-502, KLM 903, CC 1020304050…"
              aria-label="Buscar por unidad, placa o documento"
              className="h-11 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-[13px] text-ink outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-2 focus:ring-teal/20"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-teal px-5 text-[12px] font-semibold text-on-teal transition hover:bg-teal-dark"
          >
            Buscar
          </button>
          {consulta ? (
            <Link
              href="/panel/directorio"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-4 text-[12px] font-semibold text-muted transition hover:border-navy hover:text-navy"
            >
              Limpiar
            </Link>
          ) : null}
        </div>
      </form>

      <p className="mb-4 text-[12px] text-muted">
        {consulta ? (
          <>
            {total} {total === 1 ? "resultado" : "resultados"} para{" "}
            <span className="font-semibold text-ink">“{consulta}”</span>
          </>
        ) : (
          <>Mostrando los primeros registros del conjunto</>
        )}
      </p>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex items-center gap-2.5 px-5 pt-4">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-mint text-teal">
              <IconoUsuarios className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[13px] font-semibold text-navy">Personas</h2>
              <p className="text-[11px] text-muted">
                {personas.length} {personas.length === 1 ? "coincidencia" : "coincidencias"}
              </p>
            </div>
          </div>

          {personas.length === 0 ? (
            <p className="px-5 pb-5 pt-4 text-[12px] text-muted">
              Ninguna persona coincide con la búsqueda.
            </p>
          ) : (
            <ul className="mt-3 px-5 pb-4">
              {personas.map((persona) => {
                const activas = persona.vinculaciones.filter((v) => v.activo);
                return (
                  <li
                    key={persona.id}
                    className="border-t border-line-soft py-2.5 first:border-0 first:pt-0"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[12px] font-semibold text-ink">
                        {persona.nombres} {persona.apellidos}
                      </p>
                      <p className="text-[11px] tabular-nums text-muted">
                        {persona.tipo_documento} {persona.documento}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {activas.length === 0
                        ? "Sin vinculación activa"
                        : activas
                            .map(
                              (v) =>
                                `${etiquetaUnidad(v.unidades)} · ${
                                  NOMBRE_ROL[v.rol] ?? v.rol
                                }`,
                            )
                            .join(" · ")}
                      {persona.telefono ? ` · ${persona.telefono}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex items-center gap-2.5 px-5 pt-4">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-mint text-teal">
                <IconoEdificio className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-[13px] font-semibold text-navy">Unidades</h2>
                <p className="text-[11px] text-muted">
                  {unidades.length} {unidades.length === 1 ? "coincidencia" : "coincidencias"}
                </p>
              </div>
            </div>

            {unidades.length === 0 ? (
              <p className="px-5 pb-5 pt-4 text-[12px] text-muted">
                Ninguna unidad coincide con la búsqueda.
              </p>
            ) : (
              <ul className="mt-3 px-5 pb-4">
                {unidades.map((unidad) => (
                  <li
                    key={unidad.id}
                    className="flex items-center justify-between gap-3 border-t border-line-soft py-2.5 first:border-0 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-ink">
                        {etiquetaUnidad(unidad)}
                      </p>
                      <p className="text-[11px] text-muted">
                        {NOMBRE_TIPO[unidad.tipo] ?? unidad.tipo}
                      </p>
                    </div>
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        unidad.estado === "activo"
                          ? "bg-mint text-teal"
                          : "bg-canvas text-muted"
                      }`}
                    >
                      {unidad.estado === "activo" ? "Activa" : "Inactiva"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex items-center gap-2.5 px-5 pt-4">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-mint text-teal">
                <IconoVehiculo className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-[13px] font-semibold text-navy">Vehículos</h2>
                <p className="text-[11px] text-muted">
                  {vehiculos.length} {vehiculos.length === 1 ? "coincidencia" : "coincidencias"}
                </p>
              </div>
            </div>

            {vehiculos.length === 0 ? (
              <p className="px-5 pb-5 pt-4 text-[12px] text-muted">
                Ningún vehículo coincide con la búsqueda.
              </p>
            ) : (
              <ul className="mt-3 px-5 pb-4">
                {vehiculos.map((vehiculo) => (
                  <li
                    key={vehiculo.id}
                    className="flex items-center justify-between gap-3 border-t border-line-soft py-2.5 first:border-0 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold tabular-nums text-ink">
                        {vehiculo.placa}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {[vehiculo.marca, vehiculo.color, vehiculo.tipo]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-muted">
                      {etiquetaUnidad(vehiculo.unidades)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
