import { redirect } from "next/navigation";

import PanelAdministracion from "@/components/panel/vistas/administracion";
import BitacoraPorteria from "@/components/panel/vistas/porteria";
import InicioResidente from "@/components/panel/vistas/residente";
import { obtenerPerfil } from "@/utils/auth/perfil";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const { user, perfil } = await obtenerPerfil();

  if (!user) redirect("/ingresar");
  if (perfil?.rol === "admin") redirect("/admin");

  if (!perfil?.conjunto_id) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold text-amber-900">
          Tu cuenta aún no está vinculada a un conjunto
        </h1>
        <p className="mt-2 max-w-xl text-sm text-amber-800">
          La sesión funciona ({user.email}), pero tu usuario todavía no tiene un rol
          ni un conjunto asignado. Pídele a la Administración del conjunto que
          habilite tu cuenta; no necesitas hacer nada más desde aquí.
        </p>
        <p className="mt-3 text-xs text-amber-700">
          Si eres parte del equipo de la plataforma, revisa el rol de esta cuenta en
          el área de Admin.
        </p>
      </section>
    );
  }

  if (perfil.rol === "porteria") return <BitacoraPorteria />;
  if (perfil.rol === "residente") return <InicioResidente perfil={perfil} />;

  return <PanelAdministracion />;
}
