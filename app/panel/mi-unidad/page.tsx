import Link from "next/link";

import { IconoEdificio, IconoMascota, IconoUsuarios, IconoVehiculo } from "@/components/icons";
import { exigirRol } from "@/utils/auth/perfil";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type Unidad = {
  identificador: string;
  tipo: string;
  coeficiente: number;
  area_m2: number | null;
  estado: string;
  direccion: string | null;
  torres: { nombre: string } | null;
};

type Vinculacion = {
  rol: string;
  es_representante: boolean;
  personas: {
    nombres: string;
    apellidos: string;
    telefono: string | null;
    email: string | null;
  } | null;
};

type Vehiculo = {
  id: string;
  placa: string;
  tipo: string;
  marca: string | null;
  color: string | null;
};

type Mascota = {
  id: string;
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

export default async function MiUnidadPage() {
  const { perfil } = await exigirRol(["residente"]);
  const supabase = await createClient();

  if (!perfil.unidad_id) {
    return (
      <section className="rounded-xl border border-line bg-surface p-6">
        <h1 className="font-warm text-[24px] text-navy">Todavía no tienes una unidad</h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
          La administración del conjunto aún no vinculó tu usuario a una unidad.
          Cuando lo haga, aquí verás las personas, vehículos y mascotas registrados.
        </p>
        <Link
          href="/panel"
          className="mt-4 inline-flex h-9 items-center rounded-lg bg-teal px-4 text-[12px] font-semibold text-white"
        >
          Volver al inicio
        </Link>
      </section>
    );
  }

  const [unidadQ, vinculacionesQ, vehiculosQ, mascotasQ] = await Promise.all([
    supabase
      .from("unidades")
      .select("identificador, tipo, coeficiente, area_m2, estado, direccion, torres ( nombre )")
      .eq("id", perfil.unidad_id)
      .maybeSingle(),
    supabase
      .from("vinculaciones")
      .select("rol, es_representante, personas ( nombres, apellidos, telefono, email )")
      .eq("unidad_id", perfil.unidad_id)
      .eq("activo", true)
      .order("es_representante", { ascending: false }),
    supabase
      .from("vehiculos")
      .select("id, placa, tipo, marca, color")
      .eq("unidad_id", perfil.unidad_id)
      .order("placa"),
    supabase
      .from("mascotas")
      .select("id, nombre, especie, raza")
      .eq("unidad_id", perfil.unidad_id)
      .order("nombre"),
  ]);

  const unidad = (unidadQ.data as unknown as Unidad | null) ?? null;
  const vinculaciones = (vinculacionesQ.data ?? []) as unknown as Vinculacion[];
  const vehiculos = (vehiculosQ.data ?? []) as unknown as Vehiculo[];
  const mascotas = (mascotasQ.data ?? []) as unknown as Mascota[];

  const torre = unidad?.torres?.nombre ?? null;
  const tipo = unidad ? (NOMBRE_TIPO[unidad.tipo] ?? unidad.tipo) : "Unidad";
  const coeficiente = Number(unidad?.coeficiente ?? 0);

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] text-muted">
          Mi hogar <span className="mx-1 opacity-50">/</span>
          <span className="font-semibold text-teal">Mi unidad</span>
        </p>
        <h1 className="mt-2 font-warm text-[28px] leading-tight tracking-[-0.3px] text-navy">
          {[torre, `${tipo} ${unidad?.identificador ?? ""}`.trim()]
            .filter(Boolean)
            .join(" · ")}
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Datos que la administración usa para citar, autorizar y facturar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Coeficiente
          </p>
          <p className="mt-1 font-warm text-[26px] leading-none tabular-nums text-navy">
            {coeficiente.toFixed(4).replace(".", ",")} %
          </p>
          <p className="mt-2 text-[11px] text-muted">Participación en la copropiedad</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Área
          </p>
          <p className="mt-1 font-warm text-[26px] leading-none tabular-nums text-navy">
            {unidad?.area_m2 ? `${Number(unidad.area_m2)} m²` : "—"}
          </p>
          <p className="mt-2 text-[11px] text-muted">Área privada registrada</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Estado
          </p>
          <p className="mt-1 text-[22px] font-semibold leading-none text-navy">
            {unidad?.estado === "activo" ? "Activa" : "Inactiva"}
          </p>
          <p className="mt-2 text-[11px] text-muted">Estado de la unidad</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Dirección
          </p>
          <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-navy">
            {unidad?.direccion ?? "Sin dirección registrada"}
          </p>
          <p className="mt-2 text-[11px] text-muted">Dato del conjunto</p>
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center gap-2.5 px-5 pt-4">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-mint text-teal">
            <IconoUsuarios className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-warm text-[17px] text-navy">Personas</h2>
            <p className="text-[11px] text-muted">
              {vinculaciones.length}{" "}
              {vinculaciones.length === 1 ? "persona registrada" : "personas registradas"}
            </p>
          </div>
        </div>

        {vinculaciones.length === 0 ? (
          <p className="px-5 pb-5 pt-4 text-[12px] text-muted">
            La administración aún no registra personas en esta unidad.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-y border-line-soft bg-canvas/50 text-[10px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-5 py-2.5 font-semibold">Persona</th>
                  <th className="px-5 py-2.5 font-semibold">Rol</th>
                  <th className="px-5 py-2.5 font-semibold">Contacto</th>
                </tr>
              </thead>
              <tbody>
                {vinculaciones.map((v, indice) => (
                  <tr
                    key={`${v.personas?.nombres ?? "persona"}-${indice}`}
                    className="border-b border-line-soft last:border-0"
                  >
                    <td className="px-5 py-2.5 text-[12px] font-semibold text-ink">
                      {v.personas
                        ? `${v.personas.nombres} ${v.personas.apellidos}`
                        : "Persona sin nombre"}
                      {v.es_representante ? (
                        <span className="ml-2 rounded bg-mint px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-teal">
                          Representante
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-2.5 text-[12px] text-muted">
                      {NOMBRE_ROL[v.rol] ?? v.rol}
                    </td>
                    <td className="px-5 py-2.5 text-[12px] text-muted">
                      {[v.personas?.telefono, v.personas?.email].filter(Boolean).join(" · ") ||
                        "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-surface">
          <div className="flex items-center gap-2.5 px-5 pt-4">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-mint text-teal">
              <IconoVehiculo className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-warm text-[17px] text-navy">Vehículos</h2>
              <p className="text-[11px] text-muted">
                {vehiculos.length}{" "}
                {vehiculos.length === 1 ? "vehículo registrado" : "vehículos registrados"}
              </p>
            </div>
          </div>

          {vehiculos.length === 0 ? (
            <p className="px-5 pb-5 pt-4 text-[12px] text-muted">
              Sin vehículos registrados en esta unidad.
            </p>
          ) : (
            <ul className="px-5 pb-4 pt-3">
              {vehiculos.map((vehiculo) => (
                <li
                  key={vehiculo.id}
                  className="flex items-center justify-between gap-3 border-t border-line-soft py-2.5 first:border-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold tabular-nums text-ink">
                      {vehiculo.placa}
                    </p>
                    <p className="text-[11px] text-muted">
                      {[vehiculo.marca, vehiculo.color, vehiculo.tipo]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <IconoEdificio className="h-3.5 w-3.5 flex-none text-teal" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line bg-surface">
          <div className="flex items-center gap-2.5 px-5 pt-4">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-mint text-teal">
              <IconoMascota className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-warm text-[17px] text-navy">Mascotas</h2>
              <p className="text-[11px] text-muted">
                {mascotas.length}{" "}
                {mascotas.length === 1 ? "mascota registrada" : "mascotas registradas"}
              </p>
            </div>
          </div>

          {mascotas.length === 0 ? (
            <p className="px-5 pb-5 pt-4 text-[12px] text-muted">
              Sin mascotas registradas en esta unidad.
            </p>
          ) : (
            <ul className="px-5 pb-4 pt-3">
              {mascotas.map((mascota) => (
                <li
                  key={mascota.id}
                  className="flex items-center justify-between gap-3 border-t border-line-soft py-2.5 first:border-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-ink">{mascota.nombre}</p>
                    <p className="text-[11px] text-muted">
                      {[mascota.especie, mascota.raza].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <IconoMascota className="h-3.5 w-3.5 flex-none text-teal" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-4 text-[11px] text-muted">
        Para corregir o agregar datos, comunícate con la administración del conjunto.
      </p>
    </>
  );
}
