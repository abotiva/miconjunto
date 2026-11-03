import { redirect } from "next/navigation";

import { salir } from "@/app/panel/actions";
import { IconoCasa } from "@/components/icons";
import { createClient } from "@/utils/supabase/server";

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
    <div className="min-h-screen bg-canvas">
      <header className="bg-navy">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-[9px] bg-white/10 text-white">
              <IconoCasa className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.19em] text-[#8fb3d0]">
                MiConjunto
              </p>
              <p className="truncate text-sm font-semibold text-white">
                Panel de plataforma
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-[220px] truncate text-[12px] font-semibold text-white/90">
                {perfil?.nombres || user.email}
              </p>
              <p className="text-[10px] text-[#8fb3d0]">Admin</p>
            </div>
            <form action={salir}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/25 px-3 text-[12px] font-semibold text-white/90 transition hover:border-white/60"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
