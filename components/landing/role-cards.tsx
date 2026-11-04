import type { ComponentType } from "react";

import {
  IconoAlerta,
  IconoCalendario,
  IconoEdificio,
  IconoMegafono,
  IconoPaquete,
  IconoPuerta,
  IconoReloj,
  IconoUsuarios,
} from "@/components/icons";

type Rol = {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  puntos: string[];
  estado: "Disponible" | "En construcción";
  Icono: ComponentType<{ className?: string }>;
};

const ROLES: Rol[] = [
  {
    etiqueta: "Administración",
    titulo: "Panel del conjunto",
    descripcion:
      "Cifras, torres, coeficientes y auditoría en una vista que se puede proyectar en asamblea.",
    puntos: [
      "Indicadores y distribución por torre",
      "Unidades, personas y vinculaciones",
      "Accesos de soporte auditados",
    ],
    estado: "Disponible",
    Icono: IconoEdificio,
  },
  {
    etiqueta: "Portería",
    titulo: "Bitácora del turno",
    descripcion:
      "Alto contraste para la garita: qué entró, qué salió y qué quedó pendiente, sin buscar en menús.",
    puntos: [
      "Reloj y turno siempre visibles",
      "Una sola acción principal: registrar ingreso",
      "Paquetería que pasa de 24 h en ámbar",
    ],
    estado: "En construcción",
    Icono: IconoPuerta,
  },
  {
    etiqueta: "Residentes",
    titulo: "Tu casa, al día",
    descripcion:
      "La cuota, los comunicados y las visitas en lenguaje de vecindario, no de oficina.",
    puntos: [
      "La cuota primero, con estado y vencimiento",
      "Mural de comunicados del conjunto",
      "Lo que la administración sabe de tu unidad",
    ],
    estado: "En construcción",
    Icono: IconoUsuarios,
  },
];

function MiniAdministracion() {
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-line-soft bg-canvas/70 px-2.5 py-2">
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">
            Unidades
          </p>
          <p className="mt-0.5 text-[17px] font-semibold leading-none tabular-nums text-navy">
            128
          </p>
        </div>
        <div className="rounded-lg border border-line-soft bg-canvas/70 px-2.5 py-2">
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">
            Personas
          </p>
          <p className="mt-0.5 text-[17px] font-semibold leading-none tabular-nums text-navy">
            342
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-line-soft px-2.5 py-2">
        <div className="flex items-center justify-between">
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">
            Coeficiente acumulado
          </p>
          <p className="text-[9px] tabular-nums text-muted">100 %</p>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
          <div className="h-full w-full rounded-full bg-teal" />
        </div>
      </div>

      <div className="space-y-1">
        {[
          { torre: "A", numero: "302", coeficiente: "0,86 %" },
          { torre: "C", numero: "101", coeficiente: "0,79 %" },
        ].map((unidad) => (
          <div
            key={unidad.numero}
            className="flex items-center justify-between rounded-md border border-line-soft px-2.5 py-1.5"
          >
            <span className="flex items-center gap-1.5">
              <span className="rounded bg-mint px-1 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-teal">
                {unidad.torre}
              </span>
              <span className="text-[10px] font-medium tabular-nums text-navy">
                {unidad.numero}
              </span>
            </span>
            <span className="text-[9px] tabular-nums text-muted">
              {unidad.coeficiente}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniPorteria() {
  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#93aab8]">
            Turno
          </p>
          <p className="mt-0.5 text-[20px] font-semibold leading-none tabular-nums text-white">
            14:32
          </p>
        </div>
        <span className="rounded-full border border-[#1c4052] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#2fbfa6]">
          En curso
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-2">
        <span className="flex items-center gap-1.5 text-[10px] text-[#eaf3f6]">
          <IconoPuerta className="h-3 w-3 text-[#2fbfa6]" />
          Visita · Torre A 302
        </span>
        <span className="text-[9px] font-semibold text-[#2fbfa6]">Dentro</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-2">
        <span className="flex items-center gap-1.5 text-[10px] text-[#eaf3f6]">
          <IconoPaquete className="h-3 w-3 text-[#f0b26b]" />
          Paquete · Torre C 101
        </span>
        <span className="text-[9px] font-semibold text-[#f0b26b]">26 h</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-2">
        <span className="flex items-center gap-1.5 text-[10px] text-[#eaf3f6]">
          <IconoAlerta className="h-3 w-3 text-[#93aab8]" />
          Novedad · parqueadero 14
        </span>
        <span className="text-[9px] font-semibold text-[#93aab8]">Abierta</span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-dashed border-[#1c4052] px-2.5 py-2">
        <span className="flex items-center gap-1.5 text-[10px] text-[#93aab8]">
          <IconoReloj className="h-3 w-3" />
          Turno entrante
        </span>
        <span className="text-[9px] font-semibold text-[#93aab8]">14:00</span>
      </div>
    </div>
  );
}

function MiniResidente() {
  return (
    <div className="space-y-2 p-4">
      <div className="rounded-lg border border-[#e7dccb] bg-white/70 px-3 py-2.5">
        <div className="flex items-baseline justify-between">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-terracotta">
            Cuota de octubre
          </p>
          <span className="rounded-full bg-mint px-1.5 py-0.5 text-[8px] font-semibold text-teal">
            Al día
          </span>
        </div>
        <p className="mt-1 text-[21px] font-semibold leading-none tabular-nums text-warm-ink">
          $ 425.000
        </p>
        <p className="mt-1 text-[9px] text-warm-muted">
          Vence el 10 de noviembre
        </p>
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-[#e7dccb] bg-white/60 px-3 py-2">
        <IconoMegafono className="mt-0.5 h-3 w-3 flex-none text-terracotta" />
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium text-warm-ink">
            Mantenimiento del ascensor B
          </p>
          <p className="mt-0.5 text-[9px] text-warm-muted">
            Martes 11 · 8:00 a 12:00
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-[#e7dccb] bg-white/60 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[10px] text-warm-ink">
          <IconoCalendario className="h-3 w-3 text-terracotta" />
          Reservar salón comunal
        </span>
        <span className="text-[9px] font-semibold text-terracotta">
          Pronto
        </span>
      </div>
    </div>
  );
}

const MINI = [
  MiniAdministracion,
  MiniPorteria,
  MiniResidente,
];

export function RoleCards() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {ROLES.map((rol, indice) => {
        const Mini = MINI[indice];
        const disponible = rol.estado === "Disponible";

        return (
          <article
            key={rol.etiqueta}
            className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_50px_-46px_rgba(18,50,75,0.5)]"
          >
            <div
              className={`h-[216px] border-b ${
                indice === 1
                  ? "border-[#1c4052] bg-[#081924]"
                  : indice === 2
                    ? "border-[#e7dccb] bg-warm"
                    : "border-line-soft bg-canvas"
              }`}
            >
              <Mini />
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  <rol.Icono className="h-3.5 w-3.5 text-teal" />
                  {rol.etiqueta}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                    disponible
                      ? "bg-mint text-teal"
                      : "bg-warm text-terracotta"
                  }`}
                >
                  {rol.estado}
                </span>
              </div>

              <h3 className="mt-2.5 text-[19px] font-semibold leading-tight tracking-[-0.3px] text-navy">
                {rol.titulo}
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                {rol.descripcion}
              </p>

              <ul className="mt-4 space-y-2 border-t border-line-soft pt-4">
                {rol.puntos.map((punto) => (
                  <li
                    key={punto}
                    className="flex gap-2 text-[11.5px] leading-snug text-ink"
                  >
                    <span className="mt-[6px] h-1 w-1 flex-none rounded-full bg-teal" />
                    {punto}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        );
      })}
    </div>
  );
}
