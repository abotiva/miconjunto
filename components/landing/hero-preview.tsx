import { IconoPaquete } from "@/components/icons";

const TORRES = [
  { nombre: "A", unidades: 24 },
  { nombre: "B", unidades: 22 },
  { nombre: "C", unidades: 26 },
  { nombre: "D", unidades: 18 },
  { nombre: "E", unidades: 20 },
  { nombre: "F", unidades: 18 },
];

const UNIDADES = [
  { torre: "A", numero: "302", coeficiente: "0,86 %" },
  { torre: "C", numero: "101", coeficiente: "0,79 %" },
  { torre: "F", numero: "204", coeficiente: "0,94 %" },
];

const MAXIMO = Math.max(...TORRES.map((torre) => torre.unidades));

/**
 * Composición de las tres pantallas en una sola imagen, hecha con el mismo
 * sistema de tokens. Los datos son de ejemplo (Altos del Nogal) y la tarjeta
 * lo declara: la página no pretende mostrar un conjunto real.
 */
export function HeroPreview() {
  return (
    <div
      className="relative mx-auto w-full max-w-[560px] lg:max-w-none"
      role="img"
      aria-label="Vista de ejemplo del panel de administración, con una tarjeta de portería y otra del residente"
    >
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[36px] bg-[radial-gradient(120%_120%_at_72%_0%,rgba(14,122,107,0.16),transparent_62%)]"
      />

      <div
        aria-hidden="true"
        className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_36px_70px_-52px_rgba(18,50,75,0.6)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line-soft bg-line-soft/40 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#d8e0e5]" />
            <span className="h-2 w-2 rounded-full bg-[#d8e0e5]" />
            <span className="h-2 w-2 rounded-full bg-[#d8e0e5]" />
          </div>
          <p className="truncate text-[10px] font-medium text-muted">
            Altos del Nogal · Administración
          </p>
          <span className="flex-none rounded-full border border-line bg-surface px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
            Ejemplo
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { etiqueta: "Unidades", valor: "128" },
              { etiqueta: "Personas", valor: "342" },
              { etiqueta: "Torres", valor: "6" },
            ].map((dato) => (
              <div
                key={dato.etiqueta}
                className="rounded-xl border border-line-soft bg-canvas/60 px-3 py-2.5"
              >
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {dato.etiqueta}
                </p>
                <p className="mt-1 text-[22px] font-semibold leading-none tracking-[-0.5px] tabular-nums text-navy">
                  {dato.valor}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-line-soft px-3.5 py-3">
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                Unidades por torre
              </p>
              <p className="text-[10px] tabular-nums text-muted">128 en total</p>
            </div>
            <div className="mt-3 flex h-16 items-end gap-2">
              {TORRES.map((torre, indice) => (
                <span
                  key={torre.nombre}
                  className={`flex-1 rounded-t-[3px] ${
                    indice === 2 ? "bg-teal" : "bg-teal/20"
                  }`}
                  style={{ height: `${(torre.unidades / MAXIMO) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex gap-2">
              {TORRES.map((torre) => (
                <span key={torre.nombre} className="flex-1 text-center">
                  <span className="block text-[9px] text-muted">
                    {torre.nombre}
                  </span>
                  <span className="block text-[9px] font-medium tabular-nums text-ink">
                    {torre.unidades}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-line-soft">
            <div className="flex items-center justify-between border-b border-line-soft bg-canvas/60 px-3.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                Unidades recientes
              </p>
              <p className="text-[10px] text-muted">Coeficiente</p>
            </div>
            {UNIDADES.map((unidad) => (
              <div
                key={`${unidad.torre}-${unidad.numero}`}
                className="flex items-center justify-between border-b border-line-soft px-3.5 py-2 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-mint px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-teal">
                    Torre {unidad.torre}
                  </span>
                  <span className="text-[12px] font-medium tabular-nums text-navy">
                    {unidad.numero}
                  </span>
                </div>
                <span className="text-[11px] tabular-nums text-muted">
                  {unidad.coeficiente}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-2">
        <div className="rounded-xl border border-[#1c4052] bg-navy p-3.5 text-white shadow-[0_22px_44px_-34px_rgba(8,25,36,0.9)]">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#93aab8]">
              Portería · turno
            </p>
            <IconoPaquete className="h-3.5 w-3.5 text-[#2fbfa6]" />
          </div>
          <p className="mt-1.5 text-[24px] font-semibold leading-none tabular-nums tracking-[-0.4px]">
            14:32
          </p>
          <p className="mt-1 text-[10px] text-[#93aab8]">
            06:00–14:00 · 3 pendientes
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1.5">
              <span className="text-[10px]">Paquete · Torre C 101</span>
              <span className="text-[9px] font-semibold text-[#f0b26b]">
                26 h
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1.5">
              <span className="text-[10px]">Visita · Torre A 302</span>
              <span className="text-[9px] font-semibold text-[#2fbfa6]">
                Dentro
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-[#e7dccb] bg-warm-surface p-3.5 shadow-[0_22px_44px_-36px_rgba(43,37,33,0.55)]">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-terracotta">
              Tu unidad
            </p>
            <span className="text-[9px] text-warm-muted">Torre A 302</span>
          </div>
          <p className="mt-1 text-[11px] text-warm-muted">
            Cuota de octubre
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-[24px] font-semibold leading-none tabular-nums text-warm-ink">
              $ 425.000
            </p>
            <span className="rounded-full bg-mint px-1.5 py-0.5 text-[9px] font-semibold text-teal">
              Al día
            </span>
          </div>
          <p className="mt-auto border-t border-[#e7dccb] pt-2 text-[10px] text-warm-muted">
            Vence el 10 de noviembre
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-warm-muted">
            <span className="h-1 w-1 flex-none rounded-full bg-terracotta" />
            Ascensor B · mantenimiento martes 11
          </p>
        </div>
      </div>
    </div>
  );
}
