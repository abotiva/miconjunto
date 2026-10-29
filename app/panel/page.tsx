import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type Tarjeta = { etiqueta: string; valor: number | null; pendiente?: boolean };

export default async function PanelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, conjunto_id, unidad_id, nombres")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil?.conjunto_id) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold text-amber-900">
          Tu usuario aún no está vinculado a un conjunto
        </h1>
        <p className="mt-2 max-w-xl text-sm text-amber-800">
          La cuenta existe y la sesión funciona, pero falta asignarle el conjunto y el
          rol. Ejecuta el script{" "}
          <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs">
            supabase/scripts/0002_primer_conjunto.sql
          </code>{" "}
          en el SQL Editor y vuelve a cargar esta página.
        </p>
      </section>
    );
  }

  const [conjunto, unidades, personas, vinculaciones] = await Promise.all([
    supabase
      .from("conjuntos")
      .select("nombre, ciudad, direccion, coeficiente_total")
      .eq("id", perfil.conjunto_id)
      .maybeSingle(),
    supabase.from("unidades").select("*", { count: "exact", head: true }),
    supabase.from("personas").select("*", { count: "exact", head: true }),
    supabase.from("vinculaciones").select("*", { count: "exact", head: true }),
  ]);

  const tarjetas: Tarjeta[] = [
    { etiqueta: "Unidades", valor: unidades.count },
    { etiqueta: "Personas", valor: personas.count },
    { etiqueta: "Vinculaciones activas", valor: vinculaciones.count },
  ];

  const vacio =
    (unidades.count ?? 0) === 0 &&
    (personas.count ?? 0) === 0 &&
    (vinculaciones.count ?? 0) === 0;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#17375e]">
          {conjunto.data?.nombre ?? "Panel del conjunto"}
        </h1>
        <p className="mt-1 text-sm text-[#5b6b7c]">
          {[conjunto.data?.ciudad, conjunto.data?.direccion]
            .filter(Boolean)
            .join(" · ") || "Sin dirección registrada todavía"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {tarjetas.map((t) => (
          <div
            key={t.etiqueta}
            className="rounded-xl border border-[#dce3ea] bg-white p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]">
              {t.etiqueta}
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#17375e]">
              {t.valor ?? 0}
            </p>
          </div>
        ))}
      </div>

      {vacio ? (
        <section className="mt-6 rounded-xl border border-[#dce3ea] bg-white p-6">
          <h2 className="text-base font-semibold text-[#17375e]">
            El conjunto está creado y vacío
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#5b6b7c]">
            Esta es la señal de que todo quedó bien: la sesión es válida, el conjunto
            existe y las políticas RLS te están dejando ver sus datos. El siguiente
            paso es cargar las unidades y las personas.
          </p>
          <ol className="mt-4 space-y-2 text-sm text-[#1f2a36]">
            <li>1. Registrar las torres (si el conjunto las tiene).</li>
            <li>2. Cargar las unidades con su coeficiente de copropiedad.</li>
            <li>3. Registrar propietarios y residentes de cada unidad.</li>
          </ol>
        </section>
      ) : null}

      <section className="mt-6 rounded-xl border border-[#dce3ea] bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5b6b7c]">
          Estado del proyecto
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-[#5b6b7c]">Base de datos</dt>
            <dd className="font-semibold text-emerald-700">Conectada · RLS activo</dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-[#5b6b7c]">Rol de tu cuenta</dt>
            <dd className="font-semibold text-[#1f2a36]">{perfil.rol}</dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-[#5b6b7c]">Módulos disponibles</dt>
            <dd className="font-semibold text-[#1f2a36]">Panel</dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-[#5b6b7c]">Despliegue</dt>
            <dd className="font-semibold text-amber-700">Pendiente (Vercel)</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
