import type { ComponentType } from "react";
import Link from "next/link";

import {
  IconoMascota,
  IconoMegafono,
  IconoMoneda,
  IconoPorcentaje,
  IconoTelefono,
  IconoUsuarios,
  IconoVehiculo,
} from "@/components/icons";
import type { Perfil } from "@/utils/auth/perfil";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type Unidad = {
  identificador: string;
  tipo: string;
  coeficiente: number;
  area_m2: number | null;
  torres: { nombre: string } | null;
};

type Vinculacion = {
  rol: string;
  es_representante: boolean;
  personas: { nombres: string; apellidos: string } | null;
};

type Vehiculo = {
  placa: string;
  tipo: string;
  marca: string | null;
  color: string | null;
};

type Mascota = {
  nombre: string;
  especie: string;
  raza: string | null;
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

const HORA_BOGOTA = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  hour12: false,
  timeZone: "America/Bogota",
});

function saludo() {
  const hora = Number(HORA_BOGOTA.format(new Date()));
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

function numero(valor: number, decimales: number) {
  return valor.toFixed(decimales).replace(".", ",");
}

function Dato({
  Icono,
  etiqueta,
  valor,
  detalle,
}: {
  Icono: ComponentType<{ className?: string }>;
  etiqueta: string;
  valor: number;
  detalle: string;
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
          <p className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.6px] tabular-nums text-navy">
            {valor}
          </p>
          <p className="mt-2 truncate text-[11px] leading-snug text-muted">{detalle}</p>
        </div>
      </div>
    </div>
  );
}

export default async function InicioResidente({ perfil }: { perfil: Perfil }) {
  const supabase = await createClient();

  if (!perfil.unidad_id) {
    return (
      <section className="rounded-xl border border-line bg-surface p-6">
        <h1 className="font-warm text-[24px] leading-tight text-navy">
          Tu cuenta aún no tiene una unidad asignada
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
          La sesión funciona, pero la administración del conjunto todavía no vinculó
          tu usuario a una unidad. Cuando lo haga, aquí verás tu coeficiente, las
          personas registradas, tus vehículos y tus mascotas.
        </p>
        <p className="mt-3 text-[12px] text-muted">
          Si necesitas algo urgente, comunícate con la portería o con la
          administración.
        </p>
      </section>
    );
  }

  const [unidadQ, vinculacionesQ, vehiculosQ, mascotasQ, conjuntoQ] = await Promise.all([
    supabase
      .from("unidades")
      .select("identificador, tipo, coeficiente, area_m2, torres ( nombre )")
      .eq("id", perfil.unidad_id)
      .maybeSingle(),
    supabase
      .from("vinculaciones")
      .select("rol, es_representante, personas ( nombres, apellidos )")
      .eq("unidad_id", perfil.unidad_id)
      .eq("activo", true)
      .order("es_representante", { ascending: false }),
    supabase
      .from("vehiculos")
      .select("placa, tipo, marca, color")
      .eq("unidad_id", perfil.unidad_id)
      .order("placa"),
    supabase
      .from("mascotas")
      .select("nombre, especie, raza")
      .eq("unidad_id", perfil.unidad_id)
      .order("nombre"),
    supabase.from("conjuntos").select("nombre, ciudad, telefono").maybeSingle(),
  ]);

  const unidad = (unidadQ.data as unknown as Unidad | null) ?? null;
  const vinculaciones = (vinculacionesQ.data ?? []) as unknown as Vinculacion[];
  const vehiculos = (vehiculosQ.data ?? []) as unknown as Vehiculo[];
  const mascotas = (mascotasQ.data ?? []) as unknown as Mascota[];
  const conjunto = conjuntoQ.data;

  const nombre = perfil.nombres?.trim().split(/\s+/)[0] ?? "vecino";
  const torre = unidad?.torres?.nombre ?? null;
  const identificador = unidad?.identificador ?? "";
  const tipo = unidad ? (NOMBRE_TIPO[unidad.tipo] ?? unidad.tipo) : "Unidad";
  const coeficiente = Number(unidad?.coeficiente ?? 0);

  const subtitulo = [
    torre,
    `${tipo} ${identificador}`.trim(),
    conjunto?.nombre,
  ]
    .filter(Boolean)
    .join(" · ");

  const personasDetalle =
    vinculaciones.length === 0
      ? "Sin personas registradas"
      : vinculaciones
          .map((v) => v.personas?.nombres?.split(/\s+/)[0] ?? "")
          .filter(Boolean)
          .join(", ");

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] text-muted">
          Mi hogar <span className="mx-1 opacity-50">/</span>
          <span className="font-semibold text-teal">Inicio</span>
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-warm text-[28px] leading-tight tracking-[-0.3px] text-navy">
              {saludo()}, {nombre}
            </h1>
            <p className="mt-1 text-[13px] text-muted">{subtitulo}</p>
          </div>

          <Link
            href="/panel/mi-unidad"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal px-4 text-[12px] font-semibold text-white transition hover:bg-teal-dark"
          >
            <IconoUsuarios className="h-3.5 w-3.5" />
            Ver mi unidad
          </Link>
        </div>
      </div>

      <section className="grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-[1fr_1px_300px] sm:p-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Tu coeficiente
          </p>
          <p className="mt-2 font-warm text-[40px] leading-none tracking-[-1px] tabular-nums text-navy">
            {numero(coeficiente, 4)}
            <span className="ml-1 text-[18px] text-muted">%</span>
          </p>
          <p className="mt-3 max-w-[46ch] text-[12px] leading-relaxed text-muted">
            Es tu participación en la copropiedad del conjunto. Sobre este valor se
            calcula tu cuota de administración.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted">
            <span>
              Área{" "}
              <span className="font-semibold text-ink">
                {unidad?.area_m2 ? `${numero(Number(unidad.area_m2), 0)} m²` : "sin registrar"}
              </span>
            </span>
            <span>
              Tipo{" "}
              <span className="font-semibold text-ink">{tipo}</span>
            </span>
            <span>
              Torre{" "}
              <span className="font-semibold text-ink">{torre ?? "sin torre"}</span>
            </span>
          </div>
        </div>

        <div className="hidden bg-line sm:block" />

        <div className="min-w-0 border-t border-line pt-4 sm:border-0 sm:pt-0">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-mint text-teal">
              <IconoMoneda className="h-4 w-4" />
            </span>
            <p className="text-[13px] font-semibold text-navy">Cuota del mes</p>
            <span className="ml-auto rounded-full bg-canvas px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
              pronto
            </span>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            El módulo de cuotas aún no está habilitado. Cuando lo esté, aquí verás el
            monto, la fecha de vencimiento y tu estado de cuenta.
          </p>
          <p className="mt-3 text-[11px] text-muted">
            Mientras tanto, la administración del conjunto puede darte el saldo.
          </p>
        </div>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Dato
          Icono={IconoUsuarios}
          etiqueta="Personas"
          valor={vinculaciones.length}
          detalle={personasDetalle}
        />
        <Dato
          Icono={IconoVehiculo}
          etiqueta="Vehículos"
          valor={vehiculos.length}
          detalle={
            vehiculos.length === 0
              ? "Sin vehículos registrados"
              : vehiculos.map((v) => v.placa).join(", ")
          }
        />
        <Dato
          Icono={IconoMascota}
          etiqueta="Mascotas"
          valor={mascotas.length}
          detalle={
            mascotas.length === 0
              ? "Sin mascotas registradas"
              : mascotas.map((m) => m.nombre).join(", ")
          }
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="flex flex-col rounded-xl border border-line bg-surface">
          <div className="flex items-start justify-between gap-3 px-5 pt-4">
            <div>
              <h2 className="font-warm text-[17px] text-navy">Mural del conjunto</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Lo último de la administración y del comité
              </p>
            </div>
            <span className="rounded-full bg-canvas px-2.5 py-1 text-[10px] font-semibold text-muted">
              pronto
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-mint text-teal">
              <IconoMegafono className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-navy">
                Todavía no hay comunicados publicados
              </p>
              <p className="mx-auto mt-1 max-w-[44ch] text-[12px] leading-relaxed text-muted">
                El mural llega con el módulo de comunicados. Cuando la administración
                publique asambleas, mantenimientos o avisos, aparecerán aquí.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-surface">
          <div className="px-5 pt-4">
            <h2 className="font-warm text-[17px] text-navy">Tu unidad</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              {[torre, `${tipo} ${identificador}`.trim()].filter(Boolean).join(" · ")}
            </p>
          </div>

          <ul className="px-5 pb-4 pt-3">
            {vinculaciones.length === 0 ? (
              <li className="rounded-lg bg-canvas/60 px-3 py-4 text-center text-[12px] text-muted">
                La administración aún no registra personas en tu unidad.
              </li>
            ) : (
              vinculaciones.map((v, indice) => (
                <li
                  key={`${v.personas?.nombres ?? "persona"}-${indice}`}
                  className="flex items-start justify-between gap-3 border-t border-line-soft py-2.5 first:border-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-ink">
                      {v.personas
                        ? `${v.personas.nombres} ${v.personas.apellidos}`
                        : "Persona sin nombre"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {NOMBRE_ROL[v.rol] ?? v.rol}
                      {v.es_representante ? " · Representante" : ""}
                    </p>
                  </div>
                  <IconoUsuarios className="mt-0.5 h-3.5 w-3.5 flex-none text-teal" />
                </li>
              ))
            )}
          </ul>

          <div className="flex items-center justify-between gap-2 border-t border-line-soft px-5 py-2.5 text-[11px] text-muted">
            <span>
              {vehiculos.length} {vehiculos.length === 1 ? "vehículo" : "vehículos"} ·{" "}
              {mascotas.length} {mascotas.length === 1 ? "mascota" : "mascotas"}
            </span>
            <Link href="/panel/mi-unidad" className="font-semibold text-teal hover:underline">
              Ver detalle →
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-[12px] text-muted">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-mint text-teal">
          <IconoTelefono className="h-4 w-4" />
        </span>
        <p>
          Portería 24 horas ·{" "}
          <span className="font-semibold text-ink">
            {conjunto?.telefono ?? "consulta con la administración"}
          </span>
        </p>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px]">
          <IconoPorcentaje className="h-3.5 w-3.5 text-teal" />
          Coeficiente registrado
        </span>
      </div>
    </>
  );
}
