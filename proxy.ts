import type { NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/proxy";

/**
 * En Next.js 16 este archivo se llama `proxy.ts` (antes `middleware.ts`).
 * Su única responsabilidad por ahora es mantener viva la sesión de Supabase.
 */
export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todo excepto: archivos estáticos de Next, imágenes optimizadas,
     * favicon y archivos con extensión de imagen.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
