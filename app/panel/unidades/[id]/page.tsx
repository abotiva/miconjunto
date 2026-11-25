import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/utils/supabase/server";

import {
  actualizarUnidad,
  agregarMascota,
  agregarResidente,
  agregarVehiculo,
  cambiarEstadoUnidad,
  eliminarMascota,
  eliminarVehiculo,
  terminarVinculacion,
} from "./actions";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TIPOS_UNIDAD = [
  ["apartamento", "Apartamento"],
  ["casa", "Casa"],
  ["local", "Local"],
  ["parqueadero", "Parqueadero"],
  ["deposito", "Depósito"],
] as const;

const DOCUMENTOS = ["CC", "CE", "TI", "PAS", "NIT"] as const;

const ROLES = [
  ["residente", "Residente"],
  ["propietario", "Propietario"],
  ["arrendatario", "Arrendatario"],
  ["autorizado", "Autorizado"],
] as const;

const TIPOS_VEHICULO = [
  ["automovil", "Automóvil"],
  ["moto", "Moto"],
  ["bicicleta", "Bicicleta"],
  ["otro", "Otro"],
] as const;

const ESPECIES = [
  ["perro", "Perro"],
  ["gato", "Gato"],
  ["otro", "Otro"],
] as const;

const ERRORES: Record<string, string> = {
  identificador: "El identificador de la unidad es obligatorio.",
  coeficiente: "El coeficiente debe ser un número entre 0 y 100.",
  area: "El área debe ser un número positivo.",
  documento: "El número de documento es obligatorio.",
  nombre: "Para registrar una persona nueva escribe sus nombres y apellidos.",
  consentimiento:
    "Hace falta la autorización de tratamiento de datos personales de la persona.",
  email: "El correo no tiene un formato válido.",
  representante: "Esta unidad ya tiene un representante activo.",
  "ya-vinculada": "Esa persona ya está vinculada a esta unidad.",
  placa: "La placa es obligatoria.",
  "placa-duplicada": "Ya hay un vehículo registrado con esa placa en el conjunto.",
  "nombre-mascota": "La mascota necesita un nombre.",
  "23505": "Ya existe una unidad con ese identificador en la misma torre.",
  "23514": "Alguno de los datos no pertenece a este conjunto.",
  "42501": "No tienes permisos para hacer este cambio.",
};

const OK: Record<string, string> = {
  unidad: "Datos de la unidad actualizados.",
  activada: "Unidad activada.",
  desactivada: "Unidad desactivada.",
  residente: "Persona vinculada a la unidad.",
  baja: "Vinculación terminada. Queda en el historial.",
  vehiculo: "Vehículo registrado.",
  "vehiculo-baja": "Vehículo eliminado.",
  mascota: "Mascota registrada.",
  "mascota-baja": "Mascota eliminada.",
};

const CAMPO =
  "mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-2 focus:ring-teal/20";
const ETIQUETA =
  "block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted";
const BOTON_PRIMARIO =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal px-4 text-[12px] font-semibold text-white transition hover:bg-teal-dark";
const BOTON_SECUNDARIO =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-[12px] font-semibold text-navy transition hover:border-teal hover:text-teal";
const BOTON_PELIGRO =
  "inline-flex h-8 items-center justify-center rounded-lg border border-line px-3 text-[11px] font-semibold text-muted transition hover:border-red-300 hover:text-red-700";

type Persona = {
  id: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  documento: string;
  email: string | null;
  telefono: string | null;
};

type Vinculacion = {
  id: string;
  rol: string;
  es_representante: boolean;
  desde: string | null;
  hasta: string | null;
  activo: boolean;
  personas: Persona | Persona[] | null;
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

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <div className="border-b border-line-soft px-5 py-4">
        <h2 className="text-[14px] font-semibold text-navy">{titulo}</h2>
        {descripcion ? (
          <p className="mt-0.5 text-[11px] text-muted">{descripcion}</p>
        ) : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function Vacio({ children }: { children: ReactNode }) {
  return <p className="text-[12px] text-muted">{children}</p>;
}

function nombreCompleto(p: Persona) {
  return `${p.nombres} ${p.apellidos}`.trim();
}

export default async function FichaUnidadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const consulta = await searchParams;

  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("conjunto_id, rol")
    .eq("id", user.id)
    .maybeSingle();

  // El residente solo ve su propia unidad, desde su propia sección.
  if (!perfil || perfil.rol === "residente") redirect("/panel");

  const puedeEditar = perfil.rol === "administracion";

  const { data: unidad } = await supabase
    .from("unidades")
    .select(
      "id, identificador, tipo, coeficiente, area_m2, direccion, estado, torre_id, torres ( nombre )",
    )
    .eq("id", id)
    .maybeSingle();

  if (!unidad) notFound();

  const [
    { data: vinculacionesData },
    { data: vehiculosData },
    { data: mascotasData },
    { data: torres },
  ] = await Promise.all([
    supabase
      .from("vinculaciones")
      .select(
        "id, rol, es_representante, desde, hasta, activo, personas ( id, nombres, apellidos, tipo_documento, documento, email, telefono )",
      )
      .eq("unidad_id", id)
      .order("creado_en", { ascending: false }),
    supabase
      .from("vehiculos")
      .select("id, placa, tipo, marca, color")
      .eq("unidad_id", id)
      .order("placa"),
    supabase
      .from("mascotas")
      .select("id, nombre, especie, raza")
      .eq("unidad_id", id)
      .order("nombre"),
    supabase.from("torres").select("id, nombre").order("nombre"),
  ]);

  const vinculaciones = (vinculacionesData ?? []) as unknown as Vinculacion[];
  const vehiculos = (vehiculosData ?? []) as Vehiculo[];
  const mascotas = (mascotasData ?? []) as Mascota[];

  const vigentes = vinculaciones.filter((v) => v.activo);
  const historial = vinculaciones.filter((v) => !v.activo);

  const torre = Array.isArray(unidad.torres) ? unidad.torres[0] : unidad.torres;
  const activa = unidad.estado === "activo";

  const mensajeError = consulta.error
    ? (ERRORES[consulta.error] ?? `No se pudo guardar (${consulta.error}).`)
    : null;
  const mensajeOk = consulta.ok ? OK[consulta.ok] : null;

  const personaDe = (v: Vinculacion): Persona | null =>
    (Array.isArray(v.personas) ? v.personas[0] : v.personas) ?? null;

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] text-muted">
          MiConjunto <span className="mx-1 opacity-50">/</span>
          <Link href="/panel/unidades" className="hover:text-teal">
            Unidades
          </Link>
          <span className="mx-1 opacity-50">/</span>
          <span className="font-semibold text-teal">{unidad.identificador}</span>
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.6px] text-navy">
              Unidad {unidad.identificador}
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              <span className="capitalize">{unidad.tipo}</span>
              {torre?.nombre ? ` · ${torre.nombre}` : ""} · coeficiente{" "}
              <span className="font-semibold text-ink">
                {Number(unidad.coeficiente).toFixed(4)} %
              </span>
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              activa ? "bg-mint text-teal" : "bg-canvas text-muted"
            }`}
          >
            <span className="h-1 w-1 rounded-full bg-current" />
            {activa ? "Activa" : "Inactiva"}
          </span>
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

      {mensajeOk ? (
        <p className="mb-4 rounded-lg border border-teal/20 bg-mint px-3 py-2 text-sm text-teal">
          {mensajeOk}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Seccion
            titulo="Residentes"
            descripcion="Personas vinculadas a esta unidad"
          >
            {vigentes.length === 0 ? (
              <Vacio>Todavía no hay personas vinculadas a esta unidad.</Vacio>
            ) : (
              <ul className="divide-y divide-line-soft">
                {vigentes.map((v) => {
                  const persona = personaDe(v);
                  if (!persona) return null;
                  return (
                    <li
                      key={v.id}
                      className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-navy">
                          {nombreCompleto(persona)}
                          {v.es_representante ? (
                            <span className="ml-2 rounded-full bg-mint px-2 py-0.5 text-[10px] font-semibold text-teal">
                              Representante
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[11px] capitalize text-muted">
                          {v.rol} · {persona.tipo_documento} {persona.documento}
                          {v.desde ? ` · desde ${v.desde}` : ""}
                        </p>
                        {persona.email || persona.telefono ? (
                          <p className="mt-0.5 text-[11px] text-muted">
                            {[persona.telefono, persona.email].filter(Boolean).join(" · ")}
                          </p>
                        ) : null}
                      </div>

                      {puedeEditar ? (
                        <form action={terminarVinculacion}>
                          <input type="hidden" name="unidad_id" value={unidad.id} />
                          <input type="hidden" name="vinculacion_id" value={v.id} />
                          <button type="submit" className={BOTON_PELIGRO}>
                            Terminar vinculación
                          </button>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            {historial.length > 0 ? (
              <details className="mt-4 border-t border-line-soft pt-3">
                <summary className="cursor-pointer text-[11px] font-semibold text-muted hover:text-navy">
                  Historial ({historial.length})
                </summary>
                <ul className="mt-2 space-y-2">
                  {historial.map((v) => {
                    const persona = personaDe(v);
                    if (!persona) return null;
                    return (
                      <li key={v.id} className="text-[12px] text-muted">
                        <span className="font-semibold text-ink">
                          {nombreCompleto(persona)}
                        </span>{" "}
                        · <span className="capitalize">{v.rol}</span>
                        {v.desde || v.hasta
                          ? ` · ${v.desde ?? "?"} a ${v.hasta ?? "?"}`
                          : ""}
                      </li>
                    );
                  })}
                </ul>
              </details>
            ) : null}
          </Seccion>

          {puedeEditar ? (
            <Seccion
              titulo="Vincular una persona"
              descripcion="Si el documento ya está registrado en el conjunto, se reutiliza esa persona."
            >
              <form action={agregarResidente}>
                <input type="hidden" name="unidad_id" value={unidad.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="tipo_documento" className={ETIQUETA}>
                      Tipo de documento
                    </label>
                    <select
                      id="tipo_documento"
                      name="tipo_documento"
                      defaultValue="CC"
                      className={CAMPO}
                    >
                      {DOCUMENTOS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="documento" className={ETIQUETA}>
                      Documento
                    </label>
                    <input
                      id="documento"
                      name="documento"
                      required
                      maxLength={20}
                      inputMode="numeric"
                      className={CAMPO}
                    />
                  </div>
                  <div>
                    <label htmlFor="nombres" className={ETIQUETA}>
                      Nombres
                    </label>
                    <input id="nombres" name="nombres" maxLength={80} className={CAMPO} />
                  </div>
                  <div>
                    <label htmlFor="apellidos" className={ETIQUETA}>
                      Apellidos
                    </label>
                    <input
                      id="apellidos"
                      name="apellidos"
                      maxLength={80}
                      className={CAMPO}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={ETIQUETA}>
                      Correo
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      maxLength={120}
                      placeholder="Opcional"
                      className={CAMPO}
                    />
                  </div>
                  <div>
                    <label htmlFor="telefono" className={ETIQUETA}>
                      Teléfono
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      inputMode="tel"
                      maxLength={20}
                      placeholder="Opcional"
                      className={CAMPO}
                    />
                  </div>
                  <div>
                    <label htmlFor="rol" className={ETIQUETA}>
                      Relación con la unidad
                    </label>
                    <select id="rol" name="rol" defaultValue="residente" className={CAMPO}>
                      {ROLES.map(([valor, etiqueta]) => (
                        <option key={valor} value={valor}>
                          {etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="desde" className={ETIQUETA}>
                      Desde
                    </label>
                    <input id="desde" name="desde" type="date" className={CAMPO} />
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <label className="flex items-start gap-2 text-[12px] text-ink">
                    <input
                      type="checkbox"
                      name="es_representante"
                      className="mt-0.5 h-4 w-4 rounded border-line accent-teal"
                    />
                    <span>Es el representante de la unidad</span>
                  </label>
                  <label className="flex items-start gap-2 text-[12px] text-ink">
                    <input
                      type="checkbox"
                      name="consentimiento"
                      className="mt-0.5 h-4 w-4 rounded border-line accent-teal"
                    />
                    <span>
                      La persona autorizó el tratamiento de sus datos personales
                      (obligatorio al registrar una persona nueva).
                    </span>
                  </label>
                </div>

                <button type="submit" className={`${BOTON_PRIMARIO} mt-4`}>
                  Vincular a la unidad
                </button>
              </form>
            </Seccion>
          ) : null}
        </div>

        <div className="space-y-4">
          <Seccion titulo="Datos de la unidad">
            {puedeEditar ? (
              <form action={actualizarUnidad}>
                <input type="hidden" name="unidad_id" value={unidad.id} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <label htmlFor="identificador" className={ETIQUETA}>
                      Identificador
                    </label>
                    <input
                      id="identificador"
                      name="identificador"
                      required
                      maxLength={20}
                      defaultValue={unidad.identificador}
                      className={CAMPO}
                    />
                  </div>
                  <div>
                    <label htmlFor="tipo" className={ETIQUETA}>
                      Tipo
                    </label>
                    <select
                      id="tipo"
                      name="tipo"
                      defaultValue={unidad.tipo}
                      className={CAMPO}
                    >
                      {TIPOS_UNIDAD.map(([valor, etiqueta]) => (
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
                    <select
                      id="torre_id"
                      name="torre_id"
                      defaultValue={unidad.torre_id ?? ""}
                      className={CAMPO}
                    >
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
                      defaultValue={String(Number(unidad.coeficiente))}
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
                      defaultValue={unidad.area_m2 ?? ""}
                      placeholder="Opcional"
                      className={CAMPO}
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <label htmlFor="direccion" className={ETIQUETA}>
                      Dirección
                    </label>
                    <input
                      id="direccion"
                      name="direccion"
                      maxLength={120}
                      defaultValue={unidad.direccion ?? ""}
                      placeholder="Opcional"
                      className={CAMPO}
                    />
                  </div>
                </div>
                <button type="submit" className={`${BOTON_PRIMARIO} mt-4`}>
                  Guardar cambios
                </button>
              </form>
            ) : (
              <dl className="space-y-2 text-[12px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Tipo</dt>
                  <dd className="capitalize text-ink">{unidad.tipo}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Torre</dt>
                  <dd className="text-ink">{torre?.nombre ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Área</dt>
                  <dd className="text-ink">
                    {unidad.area_m2 ? `${Number(unidad.area_m2)} m²` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Dirección</dt>
                  <dd className="text-ink">{unidad.direccion ?? "—"}</dd>
                </div>
              </dl>
            )}

            {puedeEditar ? (
              <form action={cambiarEstadoUnidad} className="mt-3">
                <input type="hidden" name="unidad_id" value={unidad.id} />
                <input
                  type="hidden"
                  name="estado"
                  value={activa ? "inactivo" : "activo"}
                />
                <button type="submit" className={`${BOTON_SECUNDARIO} w-full`}>
                  {activa ? "Desactivar unidad" : "Activar unidad"}
                </button>
              </form>
            ) : null}
          </Seccion>

          <Seccion titulo="Vehículos" descripcion="Registrados para esta unidad">
            {vehiculos.length === 0 ? (
              <Vacio>Sin vehículos registrados.</Vacio>
            ) : (
              <ul className="divide-y divide-line-soft">
                {vehiculos.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold tracking-wide text-navy">
                        {v.placa}
                      </p>
                      <p className="text-[11px] capitalize text-muted">
                        {[v.tipo, v.marca, v.color].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {puedeEditar ? (
                      <form action={eliminarVehiculo}>
                        <input type="hidden" name="unidad_id" value={unidad.id} />
                        <input type="hidden" name="id" value={v.id} />
                        <button type="submit" className={BOTON_PELIGRO}>
                          Quitar
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {puedeEditar ? (
              <details className="mt-4 border-t border-line-soft pt-3">
                <summary className="cursor-pointer text-[11px] font-semibold text-teal">
                  Agregar vehículo
                </summary>
                <form action={agregarVehiculo} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <input type="hidden" name="unidad_id" value={unidad.id} />
                  <div>
                    <label htmlFor="placa" className={ETIQUETA}>
                      Placa
                    </label>
                    <input
                      id="placa"
                      name="placa"
                      required
                      maxLength={10}
                      className={`${CAMPO} uppercase`}
                    />
                  </div>
                  <div>
                    <label htmlFor="tipo-vehiculo" className={ETIQUETA}>
                      Tipo
                    </label>
                    <select
                      id="tipo-vehiculo"
                      name="tipo"
                      defaultValue="automovil"
                      className={CAMPO}
                    >
                      {TIPOS_VEHICULO.map(([valor, etiqueta]) => (
                        <option key={valor} value={valor}>
                          {etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="marca" className={ETIQUETA}>
                      Marca
                    </label>
                    <input id="marca" name="marca" maxLength={40} className={CAMPO} />
                  </div>
                  <div>
                    <label htmlFor="color" className={ETIQUETA}>
                      Color
                    </label>
                    <input id="color" name="color" maxLength={30} className={CAMPO} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <button type="submit" className={`${BOTON_SECUNDARIO} w-full`}>
                      Guardar vehículo
                    </button>
                  </div>
                </form>
              </details>
            ) : null}
          </Seccion>

          <Seccion titulo="Mascotas">
            {mascotas.length === 0 ? (
              <Vacio>Sin mascotas registradas.</Vacio>
            ) : (
              <ul className="divide-y divide-line-soft">
                {mascotas.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-navy">{m.nombre}</p>
                      <p className="text-[11px] capitalize text-muted">
                        {[m.especie, m.raza].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {puedeEditar ? (
                      <form action={eliminarMascota}>
                        <input type="hidden" name="unidad_id" value={unidad.id} />
                        <input type="hidden" name="id" value={m.id} />
                        <button type="submit" className={BOTON_PELIGRO}>
                          Quitar
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {puedeEditar ? (
              <details className="mt-4 border-t border-line-soft pt-3">
                <summary className="cursor-pointer text-[11px] font-semibold text-teal">
                  Agregar mascota
                </summary>
                <form action={agregarMascota} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <input type="hidden" name="unidad_id" value={unidad.id} />
                  <div>
                    <label htmlFor="nombre-mascota" className={ETIQUETA}>
                      Nombre
                    </label>
                    <input
                      id="nombre-mascota"
                      name="nombre"
                      required
                      maxLength={40}
                      className={CAMPO}
                    />
                  </div>
                  <div>
                    <label htmlFor="especie" className={ETIQUETA}>
                      Especie
                    </label>
                    <select
                      id="especie"
                      name="especie"
                      defaultValue="perro"
                      className={CAMPO}
                    >
                      {ESPECIES.map(([valor, etiqueta]) => (
                        <option key={valor} value={valor}>
                          {etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <label htmlFor="raza" className={ETIQUETA}>
                      Raza
                    </label>
                    <input
                      id="raza"
                      name="raza"
                      maxLength={40}
                      placeholder="Opcional"
                      className={CAMPO}
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <button type="submit" className={`${BOTON_SECUNDARIO} w-full`}>
                      Guardar mascota
                    </button>
                  </div>
                </form>
              </details>
            ) : null}
          </Seccion>
        </div>
      </div>
    </>
  );
}
