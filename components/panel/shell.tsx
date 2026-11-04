"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

import {
  IconoAlerta,
  IconoCalendario,
  IconoCasa,
  IconoCerrar,
  IconoEdificio,
  IconoEscudo,
  IconoMegafono,
  IconoMensaje,
  IconoMenu,
  IconoMoneda,
  IconoPanel,
  IconoPaquete,
  IconoPuerta,
  IconoSalir,
  IconoTelefono,
  IconoUsuarios,
  IconoVehiculo,
} from "@/components/icons";

type Icono = ComponentType<{ className?: string }>;

export type RolApp = "administracion" | "porteria" | "residente";

type Tema = "claro" | "operacion" | "calido";

type ItemNav = {
  href: string;
  label: string;
  Icono: Icono;
  listo?: boolean;
  contador?: number;
};

type ConjuntoShell = {
  nombre: string;
  ciudad: string | null;
  telefono: string | null;
  unidades: number;
  unidad: string | null;
};

type UsuarioShell = {
  nombre: string;
  email: string | null;
  rol: string;
};

const TEMA: Record<RolApp, Tema> = {
  administracion: "claro",
  porteria: "operacion",
  residente: "calido",
};

const SUBTITULO: Record<RolApp, string> = {
  administracion: "Administración",
  porteria: "Portería",
  residente: "Residente",
};

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "MC";
  return (partes[0][0] + (partes[1]?.[0] ?? "")).toUpperCase();
}

function Marca({
  compacta = false,
  rol,
}: {
  compacta?: boolean;
  rol: RolApp | null;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-[9px] bg-teal text-on-teal shadow-[0_4px_10px_-4px_rgba(14,122,107,0.5)]">
        <IconoCasa className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-[17px] font-semibold leading-none tracking-[-0.3px] text-navy">
          MiConjunto
        </p>
        {compacta ? null : (
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.19em] text-muted">
            {rol ? SUBTITULO[rol] : "Sin rol"}
          </p>
        )}
      </div>
    </div>
  );
}

function gruposDeRol(
  rol: RolApp | null,
  conjunto: ConjuntoShell,
): { titulo: string; items: ItemNav[] }[] {
  if (rol === "porteria") {
    return [
      {
        titulo: "Turno",
        items: [
          { href: "/panel", label: "Bitácora", Icono: IconoPanel, listo: true },
          { href: "/panel/visitas", label: "Visitas", Icono: IconoPuerta },
          { href: "/panel/paqueteria", label: "Paquetería", Icono: IconoPaquete },
          { href: "/panel/novedades", label: "Novedades", Icono: IconoAlerta },
        ],
      },
      {
        titulo: "Conjunto",
        items: [
          {
            href: "/panel/unidades",
            label: "Unidades",
            Icono: IconoEdificio,
            listo: true,
            contador: conjunto.unidades || undefined,
          },
          {
            href: "/panel/directorio",
            label: "Directorio",
            Icono: IconoUsuarios,
            listo: true,
          },
          { href: "/panel/vehiculos", label: "Vehículos", Icono: IconoVehiculo },
        ],
      },
    ];
  }

  if (rol === "residente") {
    return [
      {
        titulo: "Mi hogar",
        items: [
          { href: "/panel", label: "Inicio", Icono: IconoPanel, listo: true },
          {
            href: "/panel/mi-unidad",
            label: "Mi unidad",
            Icono: IconoCasa,
            listo: true,
          },
          { href: "/panel/cuotas", label: "Cuotas", Icono: IconoMoneda },
          { href: "/panel/reservas", label: "Reservas", Icono: IconoCalendario },
        ],
      },
      {
        titulo: "Comunidad",
        items: [
          { href: "/panel/comunicados", label: "Comunicados", Icono: IconoMegafono },
          { href: "/panel/pqrs", label: "PQRS", Icono: IconoMensaje },
          { href: "/panel/asambleas", label: "Asambleas", Icono: IconoUsuarios },
        ],
      },
    ];
  }

  if (rol === "administracion") {
    return [
      {
        titulo: "Gestión",
        items: [
          { href: "/panel", label: "Panel", Icono: IconoPanel, listo: true },
          {
            href: "/panel/unidades",
            label: "Unidades",
            Icono: IconoEdificio,
            listo: true,
            contador: conjunto.unidades || undefined,
          },
          { href: "/panel/reservas", label: "Reservas", Icono: IconoCalendario },
          { href: "/panel/pqrs", label: "PQRS", Icono: IconoMensaje },
        ],
      },
      {
        titulo: "Comunidad",
        items: [
          { href: "/panel/comunicados", label: "Comunicados", Icono: IconoMegafono },
          { href: "/panel/asambleas", label: "Asambleas", Icono: IconoUsuarios },
          { href: "/panel/cuotas", label: "Cuotas", Icono: IconoMoneda },
        ],
      },
      {
        titulo: "Control",
        items: [
          {
            href: "/panel/auditoria",
            label: "Auditoría",
            Icono: IconoEscudo,
            listo: true,
          },
        ],
      },
    ];
  }

  return [];
}

function NavList({
  grupos,
  pathname,
  onNavigate,
}: {
  grupos: { titulo: string; items: ItemNav[] }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {grupos.map((grupo) => (
        <div key={grupo.titulo} className="mb-5 last:mb-0">
          <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/80">
            {grupo.titulo}
          </p>
          <ul className="space-y-0.5">
            {grupo.items.map((item) => {
              const activo =
                item.href === "/panel"
                  ? pathname === "/panel"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icono = item.Icono;

              if (!item.listo) {
                return (
                  <li key={item.href}>
                    <span
                      aria-disabled="true"
                      title="Disponible en la siguiente fase"
                      className="flex h-9 cursor-default items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-muted/60"
                    >
                      <Icono className="h-4 w-4 flex-none text-muted/50" />
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto rounded bg-canvas px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
                        pronto
                      </span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={activo ? "page" : undefined}
                    className={`relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition ${
                      activo
                        ? "bg-mint font-semibold text-teal before:absolute before:-left-4 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r before:bg-teal"
                        : "text-muted hover:bg-canvas hover:text-navy"
                    }`}
                  >
                    <Icono
                      className={`h-4 w-4 flex-none ${activo ? "text-teal" : "text-muted/70"}`}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.contador ? (
                      <span className="ml-auto rounded bg-canvas px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-muted">
                        {item.contador}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

function EstadoUsuario({ usuario }: { usuario: UsuarioShell }) {
  return (
    <div className="flex items-center gap-2.5 border-t border-line pt-4">
      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-teal to-teal-dark text-[11px] font-semibold text-white">
        {iniciales(usuario.nombre)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-navy">{usuario.nombre}</p>
        <p className="truncate text-[10px] text-muted">{usuario.rol}</p>
      </div>
    </div>
  );
}

function NotaDeRol({
  rol,
  conjunto,
}: {
  rol: RolApp | null;
  conjunto: ConjuntoShell;
}) {
  if (rol === "porteria") {
    return (
      <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-line bg-canvas/60 px-2.5 py-2">
        <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-mint text-teal">
          <IconoPuerta className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-navy">Modo operación</p>
          <p className="truncate text-[10px] text-muted">Alto contraste · turno activo</p>
        </div>
      </div>
    );
  }

  if (rol === "residente") {
    return (
      <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-line bg-canvas/60 px-2.5 py-2">
        <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-mint text-teal">
          <IconoTelefono className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-navy">Portería 24 horas</p>
          <p className="truncate text-[10px] text-muted">
            {conjunto.telefono ?? "Consulta con la administración"}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export function PanelShell({
  rol,
  conjunto,
  usuario,
  salir,
  children,
}: {
  rol: RolApp | null;
  conjunto: ConjuntoShell;
  usuario: UsuarioShell;
  salir: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const grupos = gruposDeRol(rol, conjunto);
  const tema: Tema = rol ? TEMA[rol] : "claro";

  const ubicacion = [conjunto.ciudad, `${conjunto.unidades} unidades`]
    .filter(Boolean)
    .join(" · ");

  const tituloConjunto = rol === "residente" ? (conjunto.unidad ?? conjunto.nombre) : conjunto.nombre;
  const detalleConjunto =
    rol === "residente"
      ? [conjunto.nombre, conjunto.ciudad].filter(Boolean).join(" · ")
      : ubicacion || "Sin unidades registradas";

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuAbierto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setMenuAbierto(false);
    };
    window.addEventListener("keydown", alPresionar);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", alPresionar);
    };
  }, [menuAbierto]);

  return (
    <div data-tema={tema} className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-line text-navy"
        >
          <IconoMenu className="h-4 w-4" />
        </button>
        <Marca compacta rol={rol} />
        <span className="ml-auto max-w-[42%] truncate text-[11px] text-muted">
          {tituloConjunto}
        </span>
      </header>

      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-[264px] flex-none flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
          <Marca rol={rol} />

          <div className="mt-5 flex items-center gap-2.5 rounded-[10px] border border-line bg-canvas/60 px-2.5 py-2.5">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-mint text-teal">
              <IconoEdificio className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold leading-tight text-navy">
                {tituloConjunto}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-muted">{detalleConjunto}</p>
            </div>
          </div>

          <nav className="mt-6 flex-1 overflow-y-auto pr-0.5">
            <NavList grupos={grupos} pathname={pathname} />
          </nav>

          <div className="mt-4">
            <NotaDeRol rol={rol} conjunto={conjunto} />
            <EstadoUsuario usuario={usuario} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30 hidden h-16 flex-none items-center gap-4 border-b border-line bg-surface/95 px-8 backdrop-blur lg:flex">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Conjunto
              </p>
              <p className="truncate text-[13px] font-semibold text-navy">
                {conjunto.nombre}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <span className="hidden rounded-full bg-mint px-3 py-1 text-[11px] font-semibold text-teal sm:inline">
                {usuario.rol}
              </span>
              <div className="hidden border-l border-line pl-4 text-right sm:block">
                <p className="text-[12px] font-semibold text-navy">{usuario.nombre}</p>
                <p className="max-w-[220px] truncate text-[11px] text-muted">
                  {usuario.email ?? "Sin correo"}
                </p>
              </div>
              <form action={salir}>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-[12px] font-semibold text-muted transition hover:border-navy hover:text-navy"
                >
                  <IconoSalir className="h-3.5 w-3.5" />
                  Salir
                </button>
              </form>
            </div>
          </div>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <div className="mx-auto w-full max-w-[1180px]">{children}</div>
          </main>
        </div>
      </div>

      {menuAbierto ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
            className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]"
          />
          <div className="relative flex h-full w-[280px] max-w-[85%] flex-col border-r border-line bg-surface px-4 py-5 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <Marca rol={rol} />
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
                aria-label="Cerrar menú"
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 truncate rounded-lg bg-canvas px-3 py-2 text-[11px] text-muted">
              {conjunto.nombre}
              {conjunto.ciudad ? ` · ${conjunto.ciudad}` : ""}
            </p>

            <nav className="mt-5 flex-1 overflow-y-auto">
              <NavList
                grupos={grupos}
                pathname={pathname}
                onNavigate={() => setMenuAbierto(false)}
              />
            </nav>

            <NotaDeRol rol={rol} conjunto={conjunto} />

            <form action={salir} className="border-t border-line pt-4">
              <button
                type="submit"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-line text-[12px] font-semibold text-navy transition hover:border-navy"
              >
                <IconoSalir className="h-4 w-4" />
                Salir de la cuenta
              </button>
            </form>

            <div className="mt-3">
              <EstadoUsuario usuario={usuario} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
