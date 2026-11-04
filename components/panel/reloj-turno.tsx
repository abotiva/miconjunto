"use client";

import { useEffect, useState } from "react";

const HORA = new Intl.DateTimeFormat("es-CO", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Bogota",
});

const FECHA = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Bogota",
});

const HORA_BOGOTA = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  hour12: false,
  timeZone: "America/Bogota",
});

function franja(ahora: Date) {
  const hora = Number(HORA_BOGOTA.format(ahora));
  if (hora >= 6 && hora < 14) return "Turno mañana · 06:00–14:00";
  if (hora >= 14 && hora < 22) return "Turno tarde · 14:00–22:00";
  return "Turno noche · 22:00–06:00";
}

export function RelojTurno() {
  const [ahora, setAhora] = useState<Date | null>(null);

  useEffect(() => {
    setAhora(new Date());
    const intervalo = window.setInterval(() => setAhora(new Date()), 30_000);
    return () => window.clearInterval(intervalo);
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-mint text-teal">
        <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
      </span>
      <div className="min-w-0">
        <p className="text-[24px] font-semibold leading-none tracking-[-0.6px] tabular-nums text-navy">
          {ahora ? HORA.format(ahora) : "--:--"}
        </p>
        <p className="mt-1 truncate text-[10px] text-muted">
          {ahora ? FECHA.format(ahora) : "Cargando fecha"}
        </p>
      </div>
      <span className="ml-2 hidden whitespace-nowrap rounded-full bg-canvas px-2.5 py-1 text-[10px] font-semibold text-muted sm:inline">
        {ahora ? franja(ahora) : "Turno activo"}
      </span>
    </div>
  );
}
