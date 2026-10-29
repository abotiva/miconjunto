"use client";

import { useActionState } from "react";

import { ingresar, type EstadoIngreso } from "./actions";

const inicial: EstadoIngreso = { error: "" };

export function LoginForm() {
  const [estado, accion, pendiente] = useActionState(ingresar, inicial);

  return (
    <form action={accion} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]"
        >
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          className="mt-1.5 w-full rounded-lg border border-[#dce3ea] bg-white px-3 py-2.5 text-sm text-[#1f2a36] outline-none transition focus:border-[#1f7a6b] focus:ring-2 focus:ring-[#1f7a6b]/20"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-lg border border-[#dce3ea] bg-white px-3 py-2.5 text-sm text-[#1f2a36] outline-none transition focus:border-[#1f7a6b] focus:ring-2 focus:ring-[#1f7a6b]/20"
        />
      </div>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {estado.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pendiente}
        className="w-full rounded-lg bg-[#17375e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#122c4c] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendiente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
