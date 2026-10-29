import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

import { salir } from "@/app/panel/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, nombres, email")
    .eq("id", user.id)
    .maybeSingle();

  // Esta área es exclusiva del rol de plataforma.
  if (perfil?.rol !== "admin") redirect("/panel");

  return (
    <div className="min-h-screen bg-[#f6f8fa]">
      <header className="border-b border-[#dce3ea] bg-[#17375e]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8fb3d0]">
              MiConjunto
            </p>
            <p className="truncate text-sm font-semibold text-white">
              Panel de plataforma
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="truncate text-sm text-white/90">
                {perfil?.nombres || user.email}
              </p>
              <p className="text-xs text-[#8fb3d0]">Admin</p>
            </div>
            <form action={salir}>
              <button
                type="submit"
                className="rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold text-white/90 transition hover:border-white/60"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
