"use client";

import { useActionState } from "react";

import { ingresar, type EstadoIngreso } from "./actions";

const inicial: EstadoIngreso = { error: "" };

const CAMPO =
  "mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-[#9aa8b6] focus:border-teal focus:ring-2 focus:ring-teal/20";
const ETIQUETA =
  "block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted";

export function LoginForm() {
  const [estado, accion, pendiente] = useActionState(ingresar, inicial);

  return (
    <form action={accion} className="mt-7 space-y-4">
      <div>
        <label htmlFor="email" className={ETIQUETA}>
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          className={CAMPO}
        />
      </div>

      <div>
        <label htmlFor="password" className={ETIQUETA}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={CAMPO}
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
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-teal px-4 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendiente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
