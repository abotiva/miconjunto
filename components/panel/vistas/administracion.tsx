import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  IconoEdificio,
  IconoEnlace,
  IconoEscudo,
  IconoMas,
  IconoPorcentaje,
  IconoUsuarios,
} from "@/components/icons";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type Unidad = {
  id: string;
  identificador: string;
  tipo: string;
  coeficiente: number;
  area_m2: number | null;
  estado: string;
  torre_id: string | null;
  actualizado_en: string;
  torres: { nombre: string } | null;
};

type Acceso = {
  id: string;
  motivo: string;
  desde: string;
  hasta: string;
  revocado_en: string | null;
  perfiles: { nombres: string | null; email: string | null } | null;
};

const NOMBRE_TIPO: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  local: "Local",
  parqueadero: "Parqueadero",
  deposito: "Depósito",
};

const FECHA_HOY = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Bogota",
});

const FECHA_CORTA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeZone: "America/Bogota",
});

function Kpi({
  Icono,
  etiqueta,
  valor,
  nota,
  progreso,
}: {
  Icono: ComponentType<{ className?: string }>;
  etiqueta: string;
  valor: string;
  nota: ReactNode;
  progreso?: number;
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
          <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.6px] text-navy">
            {valor}
          </p>
          <div className="mt-2 text-[11px] leading-snug text-muted">{nota}</div>
          {progreso !== undefined ? (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line-soft">
              <div
                className="h-full rounded-full bg-teal"
                style={{ width: `${Math.min(100, Math.max(0, progreso))}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EstadoUnidad({ estado }: { estado: string }) {
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

export default async function PanelAdministracion() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, conjunto_id, unidad_id, nombres")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil?.conjunto_id) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold text-amber-900">
          Tu cuenta aún no está vinculada a un conjunto
        </h1>
        <p className="mt-2 max-w-xl text-sm text-amber-800">
          La sesión funciona ({user.email}), pero tu usuario todavía no tiene un rol
          ni un conjunto asignado. Pídele a la Administración del conjunto que
          habilite tu cuenta; no necesitas hacer nada más desde aquí.
        </p>
        <p className="mt-3 text-xs text-amber-700">
          Si eres parte del equipo de la plataforma, revisa el rol de esta cuenta en
          el área de Admin.
        </p>
      </section>
    );
  }

  const [conjuntoQ, unidadesQ, personasQ, vinculacionesQ, accesosQ] =
    await Promise.all([
      supabase
        .from("conjuntos")
        .select("nombre, ciudad, direccion")
        .eq("id", perfil.conjunto_id)
        .maybeSingle(),
      supabase
        .from("unidades")
        .select(
          "id, identificador, tipo, coeficiente, area_m2, estado, torre_id, actualizado_en, torres ( nombre )",
        )
        .order("actualizado_en", { ascending: false }),
      supabase.from("personas").select("*", { count: "exact", head: true }),
      supabase
        .from("vinculaciones")
        .select("*", { count: "exact", head: true })
        .eq("activo", true),
      supabase
        .from("accesos_soporte")
        .select("id, motivo, desde, hasta, revocado_en, perfiles ( nombres, email )")
        .eq("conjunto_id", perfil.conjunto_id)
        .order("desde", { ascending: false })
        .limit(4),
    ]);

  const unidades = (unidadesQ.data ?? []) as unknown as Unidad[];
  const accesos = (accesosQ.data ?? []) as unknown as Acceso[];
  const personas = personasQ.count ?? 0;
  const vinculaciones = vinculacionesQ.count ?? 0;
  const totalUnidades = unidades.length;
  const totalCoeficiente = unidades.reduce(
    (suma, unidad) => suma + Number(unidad.coeficiente ?? 0),
    0,
  );
  const ocupacion =
    totalUnidades > 0
      ? Math.min(100, Math.round((vinculaciones / totalUnidades) * 100))
      : 0;

  const porTorre = new Map<string, number>();
  for (const unidad of unidades) {
    const torre = unidad.torres?.nombre ?? "Sin torre";
    porTorre.set(torre, (porTorre.get(torre) ?? 0) + 1);
  }
  const filasTorre = [...porTorre.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const totalTorres = [...porTorre.keys()].filter((t) => t !== "Sin torre").length;
  const maxTorre = Math.max(1, ...filasTorre.map(([, n]) => n));
  const locales = unidades.filter((u) => u.tipo === "local").length;

  const vacio = totalUnidades === 0 && personas === 0 && vinculaciones === 0;
  const ahora = Date.now();

  const hoy = FECHA_HOY.format(new Date());
  const subtitulo = [
    conjuntoQ.data?.nombre,
    conjuntoQ.data?.ciudad,
    hoy.charAt(0).toUpperCase() + hoy.slice(1),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] text-[#90a1ac]">
          MiConjunto <span className="mx-1 opacity-50">/</span>
          <span className="font-semibold text-teal">Panel</span>
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.6px] text-navy">
              Panel del conjunto
            </h1>
            <p className="mt-1 text-[13px] text-muted">{subtitulo}</p>
          </div>

          <Link
            href="/panel/unidades"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal px-4 text-[12px] font-semibold text-white transition hover:bg-teal-dark"
          >
            <IconoMas className="h-3.5 w-3.5" />
            Registrar unidad
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          Icono={IconoEdificio}
          etiqueta="Unidades"
          valor={String(totalUnidades)}
          nota={`${totalTorres} ${totalTorres === 1 ? "torre" : "torres"} · ${locales} ${
            locales === 1 ? "local" : "locales"
          }`}
        />
        <Kpi
          Icono={IconoUsuarios}
          etiqueta="Personas"
          valor={String(personas)}
          nota="Registradas en el conjunto"
        />
        <Kpi
          Icono={IconoEnlace}
          etiqueta="Vinculaciones"
          valor={String(vinculaciones)}
          nota={`${ocupacion} % de ocupación`}
        />
        <Kpi
          Icono={IconoPorcentaje}
          etiqueta="Coeficiente"
          valor={`${totalCoeficiente.toFixed(2)} %`}
          nota="Acumulado · meta 100 %"
          progreso={totalCoeficiente}
        />
      </div>

      {vacio ? (
        <section className="mt-4 rounded-xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-mint text-teal">
              <IconoEdificio className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold text-navy">
                El conjunto está creado y vacío
              </h2>
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">
                La sesión es válida, el conjunto existe y las políticas RLS están
                dejando ver sus datos. El siguiente paso es cargar la estructura
                física y las personas.
              </p>

              <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                <li className="rounded-lg border border-line-soft bg-canvas/50 p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-teal">
                    Paso 1
                  </span>
                  <p className="mt-1 text-[12px] font-semibold text-ink">Torres</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    Regístralas solo si el conjunto las tiene.
                  </p>
                </li>
                <li className="rounded-lg border border-line-soft bg-canvas/50 p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-teal">
                    Paso 2
                  </span>
                  <p className="mt-1 text-[12px] font-semibold text-ink">Unidades</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    Con su coeficiente de copropiedad.
                  </p>
                </li>
                <li className="rounded-lg border border-line-soft bg-canvas/50 p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-teal">
                    Paso 3
                  </span>
                  <p className="mt-1 text-[12px] font-semibold text-ink">Personas</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    Propietarios y residentes de cada unidad.
                  </p>
                </li>
              </ol>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Link
                  href="/panel/unidades"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal px-4 text-[12px] font-semibold text-white transition hover:bg-teal-dark"
                >
                  <IconoMas className="h-3.5 w-3.5" />
                  Ir a Unidades
                </Link>
                <span className="inline-flex items-center gap-2 text-[11px] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                  Base de datos conectada · RLS activo
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
            <section className="flex flex-col rounded-xl border border-line bg-surface">
              <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
                <div>
                  <h2 className="text-[13px] font-semibold text-navy">
                    Unidades por torre
                  </h2>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Distribución de las {totalUnidades} unidades registradas
                  </p>
                </div>
                {totalTorres > 0 ? (
                  <span className="rounded-md bg-canvas px-2 py-1 text-[10px] font-semibold text-muted">
                    {totalTorres} {totalTorres === 1 ? "torre" : "torres"}
                  </span>
                ) : null}
              </div>

              <div className="flex-1 px-5 pb-5 pt-5">
                {filasTorre.length === 0 ? (
                  <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg bg-canvas/60 px-4 py-6 text-center">
                    <IconoEdificio className="h-5 w-5 text-teal" />
                    <p className="text-[12px] font-semibold text-navy">
                      Todavía no hay unidades
                    </p>
                    <p className="max-w-[32ch] text-[11px] leading-relaxed text-muted">
                      Cuando registres unidades, aquí verás cómo se reparten entre
                      las torres del conjunto.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {filasTorre.map(([torre, cantidad]) => (
                      <li key={torre}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-[13px] text-ink">{torre}</span>
                          <span className="whitespace-nowrap text-[12px] font-semibold tabular-nums text-navy">
                            {cantidad}
                            <span className="ml-1 font-normal text-muted">
                              · {Math.round((cantidad / totalUnidades) * 100)} %
                            </span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
                          <div
                            className="h-full rounded-full bg-teal"
                            style={{ width: `${(cantidad / maxTorre) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {porTorre.size > filasTorre.length ? (
                  <p className="mt-4 text-[11px] text-muted">
                    y {porTorre.size - filasTorre.length}{" "}
                    {porTorre.size - filasTorre.length === 1 ? "grupo más" : "grupos más"}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="flex flex-col rounded-xl border border-line bg-surface">
              <div className="flex items-start justify-between gap-3 px-5 pt-4">
                <div>
                  <h2 className="text-[13px] font-semibold text-navy">
                    Accesos de soporte
                  </h2>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Últimos accesos al conjunto
                  </p>
                </div>
                <Link
                  href="/panel/auditoria"
                  className="whitespace-nowrap text-[11px] font-semibold text-teal hover:underline"
                >
                  Ver todo
                </Link>
              </div>

              <div className="flex-1 px-5 pb-4 pt-3">
                {accesos.length === 0 ? (
                  <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg bg-canvas/60 px-4 py-6 text-center">
                    <IconoEscudo className="h-5 w-5 text-teal" />
                    <p className="text-[12px] font-semibold text-navy">
                      Sin accesos registrados
                    </p>
                    <p className="max-w-[30ch] text-[11px] leading-relaxed text-muted">
                      El equipo de MiConjunto no ha abierto accesos a los datos de
                      este conjunto.
                    </p>
                  </div>
                ) : (
                  <ul>
                    {accesos.map((acceso) => {
                      const vigente =
                        !acceso.revocado_en &&
                        new Date(acceso.hasta).getTime() > ahora;
                      const etiqueta = acceso.revocado_en
                        ? "Cerrado"
                        : vigente
                          ? "Vigente"
                          : "Vencido";
                      const quien =
                        acceso.perfiles?.nombres ||
                        acceso.perfiles?.email ||
                        "Equipo de soporte";

                      return (
                        <li
                          key={acceso.id}
                          className="border-t border-line-soft py-3 first:border-0 first:pt-0"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-ink">
                              {acceso.motivo}
                            </p>
                            <span
                              className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                vigente
                                  ? "bg-mint text-teal"
                                  : "bg-canvas text-muted"
                              }`}
                            >
                              {etiqueta}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[10px] text-muted">
                            {quien} · {FECHA_CORTA.format(new Date(acceso.desde))}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <section className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
              <div>
                <h2 className="text-[13px] font-semibold text-navy">
                  Unidades recientes
                </h2>
                <p className="mt-0.5 text-[11px] text-muted">
                  Últimas 5 unidades registradas o actualizadas
                </p>
              </div>
              <Link
                href="/panel/unidades"
                className="whitespace-nowrap text-[11px] font-semibold text-teal hover:underline"
              >
                Ver todas →
              </Link>
            </div>

            {unidades.length === 0 ? (
              <div className="px-5 pb-5 pt-4">
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-canvas/60 px-4 py-8 text-center">
                  <p className="text-[12px] font-semibold text-navy">
                    Aún no hay unidades registradas
                  </p>
                  <p className="max-w-[44ch] text-[11px] leading-relaxed text-muted">
                    Registra la primera unidad para empezar a repartir el coeficiente
                    de copropiedad.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[680px] border-collapse text-left">
                    <thead>
                      <tr className="border-y border-line-soft bg-[#fbfcfd] text-[10px] uppercase tracking-[0.1em] text-[#8a9ba7]">
                        <th className="px-5 py-2.5 font-semibold">Unidad</th>
                        <th className="px-5 py-2.5 font-semibold">Torre</th>
                        <th className="px-5 py-2.5 font-semibold">Tipo</th>
                        <th className="px-5 py-2.5 text-right font-semibold">
                          Coeficiente
                        </th>
                        <th className="px-5 py-2.5 text-right font-semibold">Área</th>
                        <th className="px-5 py-2.5 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="leading-snug">
                      {unidades.slice(0, 5).map((unidad) => (
                        <tr
                          key={unidad.id}
                          className="border-b border-line-soft last:border-0 transition hover:bg-canvas/60"
                        >
                          <td className="px-5 py-2.5 text-[12px] font-semibold text-navy">
                            {unidad.identificador}
                          </td>
                          <td className="px-5 py-2.5 text-[12px] text-[#3e5563]">
                            {unidad.torres?.nombre ?? "—"}
                          </td>
                          <td className="px-5 py-2.5 text-[12px] text-[#3e5563]">
                            {NOMBRE_TIPO[unidad.tipo] ?? unidad.tipo}
                          </td>
                          <td className="px-5 py-2.5 text-right text-[12px] tabular-nums text-muted">
                            {Number(unidad.coeficiente).toFixed(4)} %
                          </td>
                          <td className="px-5 py-2.5 text-right text-[12px] tabular-nums text-muted">
                            {unidad.area_m2 ? `${Number(unidad.area_m2)} m²` : "—"}
                          </td>
                          <td className="px-5 py-2.5">
                            <EstadoUnidad estado={unidad.estado} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-5 py-2.5 text-[11px] text-muted">
                  <span>
                    Mostrando {Math.min(5, totalUnidades)} de {totalUnidades}{" "}
                    {totalUnidades === 1 ? "unidad" : "unidades"}
                  </span>
                  <span>
                    Coeficiente acumulado{" "}
                    <span className="font-semibold text-ink">
                      {totalCoeficiente.toFixed(4)} %
                    </span>
                  </span>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </>
  );
}
