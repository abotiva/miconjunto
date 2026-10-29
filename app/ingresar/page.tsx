import type { Metadata } from "next";
import { redirect } from "next/navigation";

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
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#dce3ea] bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1f7a6b]">
            MiConjunto
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[#17375e]">
            Administración del conjunto
          </h1>
          <p className="mt-2 text-sm text-[#5b6b7c]">
            Ingresa con la cuenta que la administración creó para ti.
          </p>

          <LoginForm />

          <p className="mt-6 border-t border-[#eef2f6] pt-4 text-xs text-[#5b6b7c]">
            ¿No tienes cuenta o no recuerdas la contraseña? Escríbele a la
            administración del conjunto.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#5b6b7c]">
          <a href="/estado" className="underline decoration-[#c9d3dd] underline-offset-4 hover:text-[#17375e]">
            Ver diagnóstico de conexión
          </a>
        </p>
      </div>
    </main>
  );
}
