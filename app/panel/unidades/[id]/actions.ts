"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TIPOS_UNIDAD = ["apartamento", "casa", "local", "parqueadero", "deposito"];
const TIPOS_DOCUMENTO = ["CC", "CE", "TI", "PAS", "NIT"];
const ROLES_VINCULACION = ["propietario", "residente", "arrendatario", "autorizado"];
const TIPOS_VEHICULO = ["automovil", "moto", "bicicleta", "otro"];
const ESPECIES = ["perro", "gato", "otro"];

type Perfil = { conjunto_id: string | null; rol: string | null };
type Volver = (consulta: string) => never;

function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "").trim();
}

/** "" -> null, número válido -> número, texto no numérico -> NaN. */
function numero(valor: string) {
  if (valor === "") return null;
  return Number(valor.replace(",", "."));
}

function elegir(valor: string, permitidos: string[], porDefecto: string) {
  return permitidos.includes(valor) ? valor : porDefecto;
}

/** Fecha de hoy en Colombia (YYYY-MM-DD), sin el desfase de la hora UTC. */
function hoyColombia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(
    new Date(),
  );
}

/**
 * Valida sesión, rol y unidad. Solo la administración modifica la ficha.
 * `volver` redirige a la ficha con un mensaje en la URL.
 */
async function contexto(formData: FormData) {
  const unidadId = texto(formData, "unidad_id");
  if (!UUID.test(unidadId)) redirect("/panel/unidades");

  const volver: Volver = (consulta) =>
    redirect(`/panel/unidades/${unidadId}?${consulta}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("conjunto_id, rol")
    .eq("id", user.id)
    .maybeSingle<Perfil>();

  if (!perfil?.conjunto_id) redirect("/panel");
  if (perfil.rol !== "administracion") redirect(`/panel/unidades/${unidadId}`);

  const conjuntoId: string = perfil.conjunto_id;

  const refrescar = () => {
    revalidatePath("/panel/unidades");
    revalidatePath(`/panel/unidades/${unidadId}`);
  };

  return { supabase, conjuntoId, unidadId, volver, refrescar };
}

function codigo(error: { code?: string } | null, porDefecto: string) {
  return encodeURIComponent(error?.code ?? porDefecto);
}

// ---------------------------------------------------------------------
// Datos de la unidad
// ---------------------------------------------------------------------
export async function actualizarUnidad(formData: FormData) {
  const { supabase, unidadId, volver, refrescar } = await contexto(formData);

  const identificador = texto(formData, "identificador");
  const tipo = elegir(texto(formData, "tipo"), TIPOS_UNIDAD, "apartamento");
  const torreId = texto(formData, "torre_id");
  const coeficiente = numero(texto(formData, "coeficiente"));
  const area = numero(texto(formData, "area_m2"));
  const direccion = texto(formData, "direccion");

  if (!identificador) volver("error=identificador");
  if (
    coeficiente === null ||
    Number.isNaN(coeficiente) ||
    coeficiente < 0 ||
    coeficiente > 100
  ) {
    volver("error=coeficiente");
  }
  if (area !== null && (Number.isNaN(area) || area < 0)) volver("error=area");
  if (torreId && !UUID.test(torreId)) volver("error=23514");

  const { data, error } = await supabase
    .from("unidades")
    .update({
      identificador,
      tipo,
      torre_id: torreId || null,
      coeficiente,
      area_m2: area,
      direccion: direccion || null,
    })
    .eq("id", unidadId)
    .select("id")
    .maybeSingle();

  if (error) volver(`error=${codigo(error, "unidad")}`);
  // RLS no devuelve error cuando no deja actualizar: simplemente no hay fila.
  if (!data) volver("error=42501");

  refrescar();
  volver("ok=unidad");
}

export async function cambiarEstadoUnidad(formData: FormData) {
  const { supabase, unidadId, volver, refrescar } = await contexto(formData);

  const estado = texto(formData, "estado") === "inactivo" ? "inactivo" : "activo";

  const { data, error } = await supabase
    .from("unidades")
    .update({ estado })
    .eq("id", unidadId)
    .select("id")
    .maybeSingle();

  if (error) volver(`error=${codigo(error, "estado")}`);
  if (!data) volver("error=42501");

  refrescar();
  volver(`ok=${estado === "activo" ? "activada" : "desactivada"}`);
}

// ---------------------------------------------------------------------
// Residentes (personas vinculadas a la unidad)
// ---------------------------------------------------------------------
export async function agregarResidente(formData: FormData) {
  const { supabase, conjuntoId, unidadId, volver, refrescar } =
    await contexto(formData);

  const tipoDocumento = elegir(texto(formData, "tipo_documento"), TIPOS_DOCUMENTO, "CC");
  const documento = texto(formData, "documento").replace(/[\s.]/g, "");
  const nombres = texto(formData, "nombres");
  const apellidos = texto(formData, "apellidos");
  const email = texto(formData, "email").toLowerCase();
  const telefono = texto(formData, "telefono");
  const rol = elegir(texto(formData, "rol"), ROLES_VINCULACION, "residente");
  const esRepresentante = formData.get("es_representante") === "on";
  const consentimiento = formData.get("consentimiento") === "on";
  const desdeTexto = texto(formData, "desde");
  const desde = FECHA.test(desdeTexto) ? desdeTexto : null;

  if (!documento) volver("error=documento");

  // Si el documento ya está registrado en el conjunto se reutiliza la persona.
  const { data: existente, error: errorBusqueda } = await supabase
    .from("personas")
    .select("id")
    .eq("tipo_documento", tipoDocumento)
    .eq("documento", documento)
    .maybeSingle();

  if (errorBusqueda) volver(`error=${codigo(errorBusqueda, "persona")}`);

  let personaId: string | null = existente?.id ?? null;

  if (!personaId) {
    if (!nombres || !apellidos) volver("error=nombre");
    if (!consentimiento) volver("error=consentimiento");
    if (email && !CORREO.test(email)) volver("error=email");

    const { data: nueva, error: errorPersona } = await supabase
      .from("personas")
      .insert({
        conjunto_id: conjuntoId,
        tipo_documento: tipoDocumento,
        documento,
        nombres,
        apellidos,
        email: email || null,
        telefono: telefono || null,
        consentimiento: true,
      })
      .select("id")
      .single();

    if (errorPersona || !nueva) volver(`error=${codigo(errorPersona, "persona")}`);
    personaId = nueva!.id as string;
  }

  const { error } = await supabase.from("vinculaciones").insert({
    conjunto_id: conjuntoId,
    unidad_id: unidadId,
    persona_id: personaId,
    rol,
    es_representante: esRepresentante,
    desde,
  });

  if (error) {
    if (error.code === "23505") {
      volver(
        `error=${
          error.message?.includes("representante") ? "representante" : "ya-vinculada"
        }`,
      );
    }
    volver(`error=${codigo(error, "vinculacion")}`);
  }

  refrescar();
  volver("ok=residente");
}

/** Da de baja la vinculación (no borra a la persona ni el historial). */
export async function terminarVinculacion(formData: FormData) {
  const { supabase, unidadId, volver, refrescar } = await contexto(formData);

  const vinculacionId = texto(formData, "vinculacion_id");
  if (!UUID.test(vinculacionId)) volver("error=vinculacion");

  const { data, error } = await supabase
    .from("vinculaciones")
    .update({ activo: false, hasta: hoyColombia() })
    .eq("id", vinculacionId)
    .eq("unidad_id", unidadId)
    .eq("activo", true)
    .select("id")
    .maybeSingle();

  if (error) volver(`error=${codigo(error, "vinculacion")}`);
  if (!data) volver("error=42501");

  refrescar();
  volver("ok=baja");
}

// ---------------------------------------------------------------------
// Vehículos
// ---------------------------------------------------------------------
export async function agregarVehiculo(formData: FormData) {
  const { supabase, conjuntoId, unidadId, volver, refrescar } =
    await contexto(formData);

  const placa = texto(formData, "placa").replace(/[\s-]/g, "").toUpperCase();
  const tipo = elegir(texto(formData, "tipo"), TIPOS_VEHICULO, "automovil");
  const marca = texto(formData, "marca");
  const color = texto(formData, "color");

  if (!placa) volver("error=placa");

  const { error } = await supabase.from("vehiculos").insert({
    conjunto_id: conjuntoId,
    unidad_id: unidadId,
    placa,
    tipo,
    marca: marca || null,
    color: color || null,
  });

  if (error) {
    volver(`error=${error.code === "23505" ? "placa-duplicada" : codigo(error, "vehiculo")}`);
  }

  refrescar();
  volver("ok=vehiculo");
}

export async function eliminarVehiculo(formData: FormData) {
  const { supabase, unidadId, volver, refrescar } = await contexto(formData);

  const id = texto(formData, "id");
  if (!UUID.test(id)) volver("error=vehiculo");

  const { data, error } = await supabase
    .from("vehiculos")
    .delete()
    .eq("id", id)
    .eq("unidad_id", unidadId)
    .select("id");

  if (error) volver(`error=${codigo(error, "vehiculo")}`);
  if (!data || data.length === 0) volver("error=42501");

  refrescar();
  volver("ok=vehiculo-baja");
}

// ---------------------------------------------------------------------
// Mascotas
// ---------------------------------------------------------------------
export async function agregarMascota(formData: FormData) {
  const { supabase, conjuntoId, unidadId, volver, refrescar } =
    await contexto(formData);

  const nombre = texto(formData, "nombre");
  const especie = elegir(texto(formData, "especie"), ESPECIES, "perro");
  const raza = texto(formData, "raza");

  if (!nombre) volver("error=nombre-mascota");

  const { error } = await supabase.from("mascotas").insert({
    conjunto_id: conjuntoId,
    unidad_id: unidadId,
    nombre,
    especie,
    raza: raza || null,
  });

  if (error) volver(`error=${codigo(error, "mascota")}`);

  refrescar();
  volver("ok=mascota");
}

export async function eliminarMascota(formData: FormData) {
  const { supabase, unidadId, volver, refrescar } = await contexto(formData);

  const id = texto(formData, "id");
  if (!UUID.test(id)) volver("error=mascota");

  const { data, error } = await supabase
    .from("mascotas")
    .delete()
    .eq("id", id)
    .eq("unidad_id", unidadId)
    .select("id");

  if (error) volver(`error=${codigo(error, "mascota")}`);
  if (!data || data.length === 0) volver("error=42501");

  refrescar();
  volver("ok=mascota-baja");
}
