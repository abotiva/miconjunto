import type { Metadata } from "next";
import Link from "next/link";

import { HeroPreview } from "@/components/landing/hero-preview";
import { Modules } from "@/components/landing/modules";
import { RoleCards } from "@/components/landing/role-cards";
import { SiteHeader } from "@/components/landing/site-header";
import { IconoEscudo, IconoReloj, IconoUsuarios } from "@/components/icons";

export const metadata: Metadata = {
  title: "MiConjunto · El conjunto, en orden",
  description:
    "Plataforma para administrar conjuntos residenciales en Colombia: unidades, personas, portería y cuotas, con roles separados y permisos en la base de datos.",
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "MiConjunto",
    title: "MiConjunto · El conjunto, en orden",
    description:
      "Unidades, personas, portería y cuotas en un solo lugar. Cada rol ve solo lo que le corresponde.",
  },
};

const PUNTOS_HERO = [
  "Roles separados",
  "Permisos con RLS",
  "Soporte auditado",
];

const SEGURIDAD = [
  {
    titulo: "RLS en cada tabla",
    detalle:
      "Ni el rol anónimo ni un residente pueden leer datos de otra unidad. La regla vive en PostgreSQL, no en el menú.",
    Icono: IconoEscudo,
  },
  {
    titulo: "Roles separados",
    detalle:
      "Administración, portería y residentes. El servidor valida cada ruta y devuelve a la persona a donde sí puede entrar.",
    Icono: IconoUsuarios,
  },
  {
    titulo: "Soporte con vencimiento",
    detalle:
      "El administrador de la plataforma pide motivo, entra con una ventana máxima de 24 horas y deja registro.",
    Icono: IconoReloj,
  },
];

const PASOS = [
  {
    numero: "01",
    titulo: "La administración crea el conjunto",
    detalle:
      "Torres, unidades y coeficiente de copropiedad. Después, las cuentas de cada persona con su rol.",
  },
  {
    numero: "02",
    titulo: "Cada rol entra con su cuenta",
    detalle:
      "No hay registro público: los accesos los entrega la administración. Un residente nunca ve la operación de portería.",
  },
  {
    numero: "03",
    titulo: "La operación queda registrada",
    detalle:
      "Visitas, paquetes y novedades con hora y responsable. Los accesos de soporte, con motivo y caducidad.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Saltar al contenido
      </a>

      <SiteHeader />

      <main id="contenido">
        {/* Portada */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_85%_0%,rgba(14,122,107,0.10),transparent_60%)]"
          />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-14 sm:px-6 lg:grid-cols-[1.02fr_1fr] lg:gap-10 lg:py-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-medium text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                Para conjuntos residenciales de Colombia
              </p>

              <h1 className="mt-6 font-warm text-[46px] leading-[1.04] tracking-[-1.2px] text-navy sm:text-[58px] lg:text-[64px]">
                El conjunto,
                <br />
                <span className="relative inline-block">
                  en orden.
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-[6px] w-full rounded-full bg-terracotta/25"
                  />
                </span>
              </h1>

              <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-muted sm:text-[16px]">
                Unidades, personas, portería y cuotas en un solo lugar. Cada rol
                ve solo lo que le corresponde, y todo lo demás queda registrado.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/ingresar"
                  className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-3 text-[14px] font-semibold text-on-teal shadow-[0_10px_24px_-14px_rgba(14,122,107,0.8)] transition-colors hover:bg-teal-dark"
                >
                  Ingresar al panel
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="h-4 w-4"
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
                <a
                  href="#modulos"
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-5 py-3 text-[14px] font-semibold text-navy transition-colors hover:border-[#c9d6dd] hover:bg-white"
                >
                  Ver qué incluye
                </a>
              </div>

              <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
                {PUNTOS_HERO.map((punto) => (
                  <li
                    key={punto}
                    className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-teal"
                    >
                      <path
                        d="m3.5 8.5 3 3 6-7"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {punto}
                  </li>
                ))}
              </ul>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* Roles */}
        <section
          id="roles"
          className="scroll-mt-20 border-t border-line/70 bg-white/50 py-16 lg:py-20"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-terracotta">
                Una marca, tres ritmos
              </p>
              <h2 className="mt-3 font-warm text-[30px] leading-tight tracking-[-0.6px] text-navy sm:text-[36px]">
                La misma verdad, leída a la velocidad de cada oficio.
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-muted">
                No son tres productos ni tres marcas: es el mismo sistema visual
                con distinta densidad, contraste y vocabulario. Portería necesita
                ver mucho en poco espacio; administración, comparar y reportar; el
                residente, entender sin aprender.
              </p>
            </div>

            <div className="mt-10">
              <RoleCards />
            </div>
          </div>
        </section>

        {/* Módulos */}
        <section id="modulos" className="scroll-mt-20 py-16 lg:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-terracotta">
                  Estado del producto
                </p>
                <h2 className="mt-3 font-warm text-[30px] leading-tight tracking-[-0.6px] text-navy sm:text-[36px]">
                  Qué hay hoy, sin letra menuda.
                </h2>
                <p className="mt-4 text-[14px] leading-relaxed text-muted">
                  MiConjunto está en construcción y esta página lo dice. Lo que
                  aparece como disponible ya funciona con datos y permisos reales;
                  lo demás está diseñado o planeado, en ese orden.
                </p>
              </div>
              <p className="max-w-[22ch] text-[11.5px] leading-relaxed text-muted">
                Cada módulo se marca por su estado, no por lo que quisiéramos que
                fuera.
              </p>
            </div>

            <div className="mt-10">
              <Modules />
            </div>
          </div>
        </section>

        {/* Seguridad */}
        <section
          id="seguridad"
          className="scroll-mt-20 bg-navy py-16 text-white lg:py-20"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f0b26b]">
                Seguridad
              </p>
              <h2 className="mt-3 font-warm text-[30px] leading-tight tracking-[-0.6px] sm:text-[36px]">
                Quién ve qué no se decide en el menú.
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-[#b9cbd6]">
                Las reglas viven en la base de datos. Aunque alguien escriba una
                dirección a mano, la consulta devuelve solo lo que su rol permite:
                el menú acompaña, no protege.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {SEGURIDAD.map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-xl border border-white/10 bg-white/5 p-5"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-[#2fbfa6]">
                    <item.Icono className="h-4 w-4" />
                  </span>
                  <h3 className="mt-4 text-[14px] font-semibold text-white">
                    {item.titulo}
                  </h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#b9cbd6]">
                    {item.detalle}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-8 border-t border-white/10 pt-6 text-[11.5px] leading-relaxed text-[#93aab8]">
              El administrador de la plataforma no es un superusuario silencioso:
              sin un acceso de soporte vigente no ve datos del conjunto, y cada
              apertura queda en la auditoría de la administración.
            </p>
          </div>
        </section>

        {/* Cómo empezar */}
        <section id="empezar" className="scroll-mt-20 py-16 lg:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-terracotta">
                Cómo empezar
              </p>
              <h2 className="mt-3 font-warm text-[30px] leading-tight tracking-[-0.6px] text-navy sm:text-[36px]">
                Empezar toma tres pasos.
              </h2>
            </div>

            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {PASOS.map((paso) => (
                <li key={paso.numero} className="border-t border-line pt-5">
                  <p className="font-warm text-[26px] leading-none tabular-nums text-terracotta">
                    {paso.numero}
                  </p>
                  <h3 className="mt-3 text-[14px] font-semibold leading-snug text-navy">
                    {paso.titulo}
                  </h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                    {paso.detalle}
                  </p>
                </li>
              ))}
            </ol>

            <p className="mt-10 max-w-3xl rounded-xl border border-line bg-surface px-4 py-3 text-[11.5px] leading-relaxed text-muted">
              <span className="font-semibold text-navy">Nota de alcance:</span>{" "}
              hoy las cuentas se crean desde Supabase. La pantalla de invitaciones
              y cambio de rol es el siguiente paso; mientras tanto, cada usuario
              nuevo entra como residente y la administración confirma su unidad.
            </p>
          </div>
        </section>

        {/* Cierre */}
        <section className="border-t border-[#e7dccb] bg-warm py-16 lg:py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-4 sm:px-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-warm text-[32px] leading-tight tracking-[-0.6px] text-warm-ink sm:text-[40px]">
                Tu conjunto, en orden.
              </h2>
              <p className="mt-3 max-w-[52ch] text-[13.5px] leading-relaxed text-warm-muted">
                Ingresa con la cuenta que la administración creó para ti. Si aún
                no la tienes, escríbele a la administración del conjunto.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/ingresar"
                className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-3 text-[14px] font-semibold text-on-teal transition-colors hover:bg-teal-dark"
              >
                Ingresar
              </Link>
              <Link
                href="/estado"
                className="inline-flex items-center gap-2 rounded-lg border border-[#d9cbb6] bg-warm-surface px-5 py-3 text-[14px] font-semibold text-warm-ink transition-colors hover:bg-white"
              >
                Diagnóstico de conexión
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-canvas py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[14px] font-semibold text-navy">MiConjunto</p>
            <p className="mt-1.5 max-w-[40ch] text-[11.5px] leading-relaxed text-muted">
              Administración de conjuntos residenciales. Hecho en Colombia.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-4 text-[11.5px]">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Producto
              </p>
              <Link
                href="/ingresar"
                className="block text-navy underline-offset-4 hover:underline"
              >
                Ingresar
              </Link>
              <Link
                href="/estado"
                className="block text-navy underline-offset-4 hover:underline"
              >
                Estado del sistema
              </Link>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Proyecto
              </p>
              <a
                href="https://github.com/abotiva/miconjunto"
                className="block text-navy underline-offset-4 hover:underline"
                rel="noreferrer"
                target="_blank"
              >
                Repositorio
              </a>
              <a
                href="#contenido"
                className="block text-navy underline-offset-4 hover:underline"
              >
                Volver arriba
              </a>
            </div>
          </div>

          <p className="text-[11px] text-muted md:text-right">
            v0.5 en construcción
            <br />
            <span className="text-[10.5px]">Noviembre de 2026</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
