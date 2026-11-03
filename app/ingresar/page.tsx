import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { IconoCasa } from "@/components/icons";
import { createClient } from "@/utils/supabase/server";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar · MiConjunto" };

export const dynamic = "force-dynamic";

export default async function IngresarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/panel");

  return (
    <main className="flex min-h-screen items-center justify-center bg-warm px-4 py-10 sm:px-6">
      <div className="w-full max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-[#e6dccd] bg-warm-surface shadow-[0_30px_70px_-45px_rgba(43,37,33,0.5)]">
          <div className="grid lg:grid-cols-[1.02fr_1fr]">
            <aside className="hidden flex-col justify-between bg-warm p-9 lg:flex">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-teal text-white shadow-[0_4px_10px_-4px_rgba(14,122,107,0.5)]">
                    <IconoCasa className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[17px] font-semibold leading-none tracking-[-0.3px] text-warm-ink">
                      MiConjunto
                    </p>
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.19em] text-warm-muted">
                      Administración
                    </p>
                  </div>
                </div>

                <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.2em] text-terracotta">
                  Para tu conjunto
                </p>
                <h1 className="mt-3 font-warm text-[34px] leading-[1.15] text-warm-ink">
                  Tu conjunto,
                  <br />
                  en orden.
                </h1>
                <p className="mt-4 max-w-[32ch] text-[13px] leading-relaxed text-warm-muted">
                  Unidades, cuotas, portería y comunicados en un solo lugar, con la
                  tranquilidad de saber quién ve qué.
                </p>

                <ul className="mt-8 space-y-3 text-[12px] leading-relaxed text-[#4a4038]">
                  <li className="flex gap-2.5">
                    <span className="mt-[7px] h-1 w-1 flex-none rounded-full bg-terracotta" />
                    Cada rol ve solo lo que le corresponde.
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-[7px] h-1 w-1 flex-none rounded-full bg-terracotta" />
                    Los accesos de soporte quedan registrados y caducan solos.
                  </li>
                </ul>
              </div>

              <p className="mt-10 text-[11px] text-[#8a7b6d]">
                Hecho para conjuntos residenciales de Colombia.
              </p>
            </aside>

            <div className="bg-white p-6 sm:p-9">
              <div className="mb-6 flex items-center gap-2.5 lg:hidden">
                <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-teal text-white">
                  <IconoCasa className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-[17px] font-semibold leading-none tracking-[-0.3px] text-navy">
                    MiConjunto
                  </p>
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.19em] text-muted">
                    Administración
                  </p>
                </div>
              </div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-terracotta">
                MiConjunto
              </p>
              <h2 className="mt-3 font-warm text-[28px] leading-tight text-warm-ink">
                Administración del conjunto
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Ingresa con la cuenta que la administración creó para ti.
              </p>

              <LoginForm />

              <p className="mt-6 border-t border-line-soft pt-4 text-[11px] leading-relaxed text-muted">
                ¿No tienes cuenta o no recuerdas la contraseña? Escríbele a la
                administración del conjunto.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-warm-muted">
          <a
            href="/estado"
            className="underline decoration-[#cbbfae] underline-offset-4 transition hover:text-warm-ink"
          >
            Ver diagnóstico de conexión
          </a>
        </p>
      </div>
    </main>
  );
}
