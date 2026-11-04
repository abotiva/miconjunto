import type { ComponentType } from "react";

import {
  IconoCalendario,
  IconoEdificio,
  IconoEscudo,
  IconoMegafono,
  IconoMensaje,
  IconoMoneda,
  IconoPanel,
  IconoPaquete,
  IconoPorcentaje,
  IconoPuerta,
  IconoUsuarios,
  IconoVehiculo,
} from "@/components/icons";

type Estado = "Disponible" | "En construcción" | "Próximo";

type Modulo = {
  titulo: string;
  detalle: string;
  Icono: ComponentType<{ className?: string }>;
};

const GRUPOS: { estado: Estado; nota: string; modulos: Modulo[] }[] = [
  {
    estado: "Disponible",
    nota: "Ya vive en la base de datos, con RLS por rol.",
    modulos: [
      {
        titulo: "Unidades y torres",
        detalle: "Alta, coeficiente y distribución por torre.",
        Icono: IconoEdificio,
      },
      {
        titulo: "Personas y vinculaciones",
        detalle: "Propietarios, residentes y arrendatarios por unidad.",
        Icono: IconoUsuarios,
      },
      {
        titulo: "Vehículos y mascotas",
        detalle: "Registro por unidad, consultable desde portería.",
        Icono: IconoVehiculo,
      },
      {
        titulo: "Directorio",
        detalle: "Búsqueda por unidad, placa o documento.",
        Icono: IconoPanel,
      },
      {
        titulo: "Auditoría de accesos",
        detalle: "Quién entró, por qué y hasta cuándo.",
        Icono: IconoEscudo,
      },
      {
        titulo: "Acceso por rol",
        detalle: "Cada rol entra solo a lo suyo, validado en el servidor.",
        Icono: IconoPuerta,
      },
    ],
  },
  {
    estado: "En construcción",
    nota: "Tiene diseño y orden de construcción definidos.",
    modulos: [
      {
        titulo: "Portería",
        detalle: "Visitas, paquetería y novedades del turno.",
        Icono: IconoPaquete,
      },
      {
        titulo: "Inicio del residente",
        detalle: "Cuota, comunicados y visitas de tu unidad.",
        Icono: IconoMensaje,
      },
      {
        titulo: "Cuotas",
        detalle: "Valor por unidad según su coeficiente.",
        Icono: IconoMoneda,
      },
    ],
  },
  {
    estado: "Próximo",
    nota: "Planeado, aún sin fecha de entrega.",
    modulos: [
      {
        titulo: "Comunicados",
        detalle: "Mural del conjunto, con acuse de lectura.",
        Icono: IconoMegafono,
      },
      {
        titulo: "Reservas",
        detalle: "Zonas comunes con cupo y calendario.",
        Icono: IconoCalendario,
      },
      {
        titulo: "PQRS",
        detalle: "Peticiones con radicado y respuesta trazable.",
        Icono: IconoMensaje,
      },
      {
        titulo: "Asambleas",
        detalle: "Convocatoria, quórum y decisiones.",
        Icono: IconoPorcentaje,
      },
    ],
  },
];

const ESTILO: Record<Estado, { punto: string; chip: string }> = {
  Disponible: {
    punto: "bg-teal",
    chip: "bg-mint text-teal",
  },
  "En construcción": {
    punto: "bg-terracotta",
    chip: "bg-warm text-terracotta",
  },
  Próximo: {
    punto: "bg-[#b6c4ce]",
    chip: "bg-line-soft text-muted",
  },
};

export function Modules() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {GRUPOS.map((grupo) => (
        <div
          key={grupo.estado}
          className="rounded-2xl border border-line bg-surface p-5 shadow-[0_24px_50px_-50px_rgba(18,50,75,0.45)]"
        >
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${ESTILO[grupo.estado].punto}`}
            />
            <h3 className="text-[13px] font-semibold text-navy">
              {grupo.estado}
            </h3>
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
                ESTILO[grupo.estado].chip
              }`}
            >
              {grupo.modulos.length}
            </span>
          </div>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
            {grupo.nota}
          </p>

          <ul className="mt-4 space-y-3.5 border-t border-line-soft pt-4">
            {grupo.modulos.map((modulo) => (
              <li key={modulo.titulo} className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg border border-line-soft bg-canvas/70 text-teal">
                  <modulo.Icono className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium leading-snug text-navy">
                    {modulo.titulo}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted">
                    {modulo.detalle}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
