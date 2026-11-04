import type { ComponentType } from "react";
import Link from "next/link";

import {
  IconoAlerta,
  IconoBuscar,
  IconoEdificio,
  IconoMascota,
  IconoPaquete,
  IconoPuerta,
  IconoUsuarios,
  IconoVehiculo,
} from "@/components/icons";
import { RelojTurno } from "@/components/panel/reloj-turno";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

function Kpi({
  Icono,
  etiqueta,
  valor,
  nota,
}: {
  Icono: ComponentType<{ className?: string }>;
  etiqueta: string;
  valor: number;
  nota: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-mint text-teal">
          <Icono className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            {etiqueta}
          </p>
          <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.6px] tabular-nums text-navy">
            {valor}
          </p>
          <p className="mt-2 text-[11px] leading-snug text-muted">{nota}</p>
        </div>
      </div>
    </div>
  );
}

const PENDIENTES = [
  {
    Icono: IconoPuerta,
    titulo: "Visitas",
    detalle: "Autorización del residente, pase y control de entrada y salida.",
  },
  {
    Icono: IconoPaquete,
    titulo: "Paquetería",
    detalle: "Recepción, tiempo de espera y entrega con firma.",
  },
  {
    Icono: IconoAlerta,
    titulo: "Novedades",
    detalle: "Reportes del turno con responsable y estado.",
  },
];

export default async function BitacoraPorteria() {
  const supabase = await createClient();

  const [conjuntoQ, unidadesQ, personasQ, vehiculosQ, mascotasQ] = await Promise.all([
    supabase.from("conjuntos").select("nombre, ciudad").maybeSingle(),
    supabase.from("unidades").select("*", { count: "exact", head: true }),
    supabase.from("personas").select("*", { count: "exact", head: true }),
    supabase.from("vehiculos").select("*", { count: "exact", head: true }),
    supabase.from("mascotas").select("*", { count: "exact", head: true }),
  ]);

  const conjunto = conjuntoQ.data;
  const unidades = unidadesQ.count ?? 0;
  const personas = personasQ.count ?? 0;
  const vehiculos = vehiculosQ.count ?? 0;
  const mascotas = mascotasQ.count ?? 0;

  const subtitulo = [
    conjunto?.nombre,
    conjunto?.ciudad,
    `${unidades} ${unidades === 1 ? "unidad" : "unidades"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] text-muted">
          Portería <span className="mx-1 opacity-50">/</span>
          <span className="font-semibold text-teal">Turno</span>
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.6px] text-navy">
              Bitácora del turno
            </h1>
            <p className="mt-1 text-[13px] text-muted">{subtitulo}</p>
          </div>

          <RelojTurno />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          Icono={IconoEdificio}
          etiqueta="Unidades"
          valor={unidades}
          nota="Para ubicar una unidad por identificador"
        />
        <Kpi
          Icono={IconoUsuarios}
          etiqueta="Personas"
          valor={personas}
          nota="Directorio de residentes y autorizados"
        />
        <Kpi
          Icono={IconoVehiculo}
          etiqueta="Vehículos"
          valor={vehiculos}
          nota="Placas registradas en el conjunto"
        />
        <Kpi
          Icono={IconoMascota}
          etiqueta="Mascotas"
          valor={mascotas}
          nota="Registros asociados a una unidad"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="flex flex-col rounded-xl border border-line bg-surface">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
            <div>
              <h2 className="text-[13px] font-semibold text-navy">
                Movimientos del turno
              </h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Entradas, salidas y entregas registradas en portería
              </p>
            </div>
            <span className="rounded-full bg-canvas px-2.5 py-1 text-[10px] font-semibold text-muted">
              Sin movimientos
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-mint text-teal">
              <IconoPuerta className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-navy">
                La bitácora se activa con el módulo de portería
              </p>
              <p className="mx-auto mt-1 max-w-[46ch] text-[12px] leading-relaxed text-muted">
                Visitas, paquetería y novedades necesitan sus propias tablas y
                políticas por rol. Mientras tanto, portería ya puede consultar el
                directorio y las unidades del conjunto.
              </p>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/panel/directorio"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal px-4 text-[12px] font-semibold text-on-teal transition hover:bg-teal-dark"
              >
                <IconoBuscar className="h-3.5 w-3.5" />
                Buscar en el directorio
              </Link>
              <Link
                href="/panel/unidades"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-4 text-[12px] font-semibold text-navy transition hover:border-teal hover:text-teal"
              >
                <IconoEdificio className="h-3.5 w-3.5" />
                Ver unidades
              </Link>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="text-[13px] font-semibold text-navy">Buscar en el conjunto</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              Por unidad, placa o documento
            </p>

            <form action="/panel/directorio" className="mt-3">
              <label htmlFor="q" className="sr-only">
                Buscar unidad, placa o documento
              </label>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="q"
                    name="q"
                    type="search"
                    placeholder="B-502, KLM 903, CC 1020…"
                    className="h-10 w-full rounded-lg border border-line bg-canvas/40 pl-9 pr-3 text-[13px] text-ink outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-2 focus:ring-teal/20"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-10 flex-none items-center rounded-lg bg-teal px-3 text-[12px] font-semibold text-on-teal transition hover:bg-teal-dark"
                >
                  Buscar
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="text-[13px] font-semibold text-navy">Módulos de portería</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              Diseñados y pendientes de datos
            </p>

            <ul className="mt-3 space-y-2.5">
              {PENDIENTES.map(({ Icono, titulo, detalle }) => (
                <li key={titulo} className="flex items-start gap-2.5">
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-canvas text-muted">
                    <Icono className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-semibold text-navy">{titulo}</p>
                      <span className="rounded bg-canvas px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
                        pronto
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted">{detalle}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
