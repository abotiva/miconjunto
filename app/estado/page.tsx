import { createClient } from "@/utils/supabase/server";
import { supabaseKey, supabaseProjectRef, supabaseUrl } from "@/utils/supabase/env";

export const dynamic = "force-dynamic";

type Probe = {
  name: string;
  ok: boolean;
  detail: string;
  /** true cuando la tabla todavía no existe. */
  pending?: boolean;
};

/** Comprueba que el servicio de autenticación responde con la clave pública. */
async function probeAuth(): Promise<Probe> {
  const started = Date.now();
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseKey },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return {
      name: "Servicio de autenticación",
      ok: response.ok,
      detail: `HTTP ${response.status} · ${Date.now() - started} ms`,
    };
  } catch (error) {
    return {
      name: "Servicio de autenticación",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Comprueba la API de datos usando exactamente el mismo cliente que usará la
 * aplicación. Mientras no exista el esquema, PostgREST responde PGRST205
 * ("tabla no encontrada"), que es una respuesta correcta: significa que la
 * petición pasó la autenticación y llegó a la base de datos.
 */
async function probeData(): Promise<Probe> {
  const started = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("unidades").select("id").limit(1);
    const ms = Date.now() - started;

    if (!error) {
      return { name: "API de datos", ok: true, detail: `HTTP 200 · ${ms} ms · tabla lista` };
    }

    if (error.code === "PGRST205" || error.code === "42P01") {
      return {
        name: "API de datos",
        ok: true,
        detail: `Conectada · ${ms} ms · falta crear el esquema`,
        pending: true,
      };
    }

    // La tabla existe pero el rol anónimo no tiene permiso: es lo esperado,
    // porque los datos solo se abren a usuarios autenticados con RLS.
    if (error.code === "42501" || error.message.toLowerCase().includes("permission denied")) {
      return {
        name: "API de datos",
        ok: true,
        detail: `Conectada · ${ms} ms · tabla lista y protegida`,
      };
    }

    return {
      name: "API de datos",
      ok: false,
      detail: `${error.code ?? "error"}: ${error.message}`,
    };
  } catch (error) {
    return {
      name: "API de datos",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`}
      aria-hidden
    />
  );
}

export default async function Page() {
  const [auth, data] = await Promise.all([probeAuth(), probeData()]);
  const allOk = auth.ok && data.ok;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1f7a6b]">
          MiConjunto
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#17375e]">
          Diagnóstico de conexión
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#5b6b7c]">
          Esta página solo comprueba que la aplicación habla con Supabase. Todavía no
          hay módulos ni datos: es el primer eslabón del proyecto.
        </p>
      </header>

      <section className="rounded-xl border border-[#dce3ea] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-[#eef2f6] pb-4">
          <div>
            <h2 className="text-base font-semibold text-[#17375e]">Proyecto</h2>
            <p className="mt-1 font-mono text-xs text-[#5b6b7c]">{supabaseProjectRef}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              allOk ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {allOk ? "Conectado" : "Revisar"}
          </span>
        </div>

        <dl className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-sm text-[#1f2a36]">
              <StatusDot ok={auth.ok} />
              {auth.name}
            </dt>
            <dd className="text-right font-mono text-xs text-[#5b6b7c]">{auth.detail}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-sm text-[#1f2a36]">
              <StatusDot ok={data.ok} />
              {data.name}
            </dt>
            <dd className="text-right font-mono text-xs text-[#5b6b7c]">{data.detail}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[#eef2f6] pt-3">
            <dt className="text-sm text-[#1f2a36]">Clave pública en uso</dt>
            <dd className="font-mono text-xs text-[#5b6b7c]">{supabaseKey.slice(0, 16)}…</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-[#1f2a36]">URL del proyecto</dt>
            <dd className="font-mono text-xs text-[#5b6b7c]">{supabaseUrl}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-[#dce3ea] bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5b6b7c]">
          Siguiente paso
        </h2>
        <ol className="mt-3 space-y-2 text-sm text-[#1f2a36]">
          {data.pending ? (
            <>
              <li>1. Ejecutar la migración del núcleo en el SQL Editor de Supabase.</li>
              <li>2. Crear el primer conjunto y el usuario administrador.</li>
              <li>3. Configurar autenticación y políticas RLS por unidad.</li>
            </>
          ) : (
            <>
              <li>1. Crear el primer conjunto y el usuario administrador.</li>
              <li>2. Construir el módulo de unidades y residentes.</li>
              <li>3. Desplegar en Vercel con las variables de entorno.</li>
            </>
          )}
        </ol>
      </section>

      <footer className="mt-auto pt-10 text-xs text-[#5b6b7c]">
        MiConjunto · diagnóstico generado en el servidor en cada petición
      </footer>
    </main>
  );
}
