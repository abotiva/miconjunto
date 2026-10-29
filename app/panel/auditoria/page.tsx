import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const formato = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

type Acceso = {
  id: string;
  motivo: string;
  desde: string;
  hasta: string;
  revocado_en: string | null;
  perfiles: { nombres: string | null; email: string | null } | null;
};

export default async function AuditoriaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("conjunto_id, rol")
    .eq("id", user!.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("accesos_soporte")
    .select("id, motivo, desde, hasta, revocado_en, perfiles ( nombres, email )")
    .eq("conjunto_id", perfil?.conjunto_id ?? "")
    .order("desde", { ascending: false })
    .limit(50);

  const accesos = (data ?? []) as unknown as Acceso[];
  const ahora = Date.now();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#17375e]">
          Accesos de soporte
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#5b6b7c]">
          Cada vez que el equipo de MiConjunto necesita revisar datos del conjunto,
          debe abrir un acceso temporal con un motivo escrito. Aquí queda el
          registro completo: quién entró, cuándo, por qué y hasta cuándo.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          No se pudo cargar la auditoría: {error.message}
        </p>
      ) : accesos.length === 0 ? (
        <section className="rounded-xl border border-[#dce3ea] bg-white p-6">
          <h2 className="text-base font-semibold text-[#17375e]">
            Ningún acceso registrado
          </h2>
          <p className="mt-2 text-sm text-[#5b6b7c]">
            Nadie del equipo de la plataforma ha abierto un acceso a los datos de
            este conjunto.
          </p>
        </section>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#dce3ea] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f7f9fb] text-xs uppercase tracking-wide text-[#5b6b7c]">
              <tr>
                <th className="px-4 py-3 font-semibold">Quién</th>
                <th className="px-4 py-3 font-semibold">Motivo</th>
                <th className="px-4 py-3 font-semibold">Desde</th>
                <th className="px-4 py-3 font-semibold">Hasta</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f6]">
              {accesos.map((a) => {
                const estado = a.revocado_en
                  ? "Cerrado antes de tiempo"
                  : new Date(a.hasta).getTime() > ahora
                    ? "Vigente"
                    : "Vencido";
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3">
                      {a.perfiles?.nombres || a.perfiles?.email || "Equipo de soporte"}
                    </td>
                    <td className="px-4 py-3 text-[#5b6b7c]">{a.motivo}</td>
                    <td className="px-4 py-3 text-[#5b6b7c]">
                      {formato.format(new Date(a.desde))}
                    </td>
                    <td className="px-4 py-3 text-[#5b6b7c]">
                      {formato.format(new Date(a.hasta))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          estado === "Vigente"
                            ? "font-semibold text-emerald-700"
                            : estado === "Vencido"
                              ? "text-[#5b6b7c]"
                              : "font-semibold text-amber-700"
                        }
                      >
                        {estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
