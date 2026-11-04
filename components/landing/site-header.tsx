import Link from "next/link";

import { IconoCasa } from "@/components/icons";

const ENLACES = [
  { href: "#roles", label: "Roles" },
  { href: "#modulos", label: "Módulos" },
  { href: "#seguridad", label: "Seguridad" },
  { href: "#empezar", label: "Cómo empezar" },
];

/**
 * Cabecera pública. No usa estado de sesión: la página es estática y el
 * formulario de ingreso resuelve solo si ya hay una sesión activa.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="MiConjunto, ir al inicio"
          className="flex items-center gap-2.5"
        >
          <span className="grid h-9 w-9 flex-none place-items-center rounded-[9px] bg-teal text-on-teal shadow-[0_4px_10px_-4px_rgba(14,122,107,0.5)]">
            <IconoCasa className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block text-[17px] font-semibold leading-none tracking-[-0.3px] text-navy">
              MiConjunto
            </span>
            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.19em] text-muted">
              Administración
            </span>
          </span>
        </Link>

        <nav
          aria-label="Secciones de la página"
          className="hidden items-center gap-7 md:flex"
        >
          {ENLACES.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="text-[13px] font-medium text-muted transition-colors hover:text-navy"
            >
              {enlace.label}
            </a>
          ))}
        </nav>

        <Link
          href="/ingresar"
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0e2a3f]"
        >
          Ingresar
          <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="h-3.5 w-3.5"
          >
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}
