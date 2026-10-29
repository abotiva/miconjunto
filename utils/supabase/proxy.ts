import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { supabaseKey, supabaseUrl } from "./env";

/**
 * Refresca la sesión de Supabase en cada petición y devuelve la respuesta con
 * las cookies actualizadas. Se invoca desde `proxy.ts`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // No quitar: getUser() valida el token contra Supabase y fuerza el refresco.
  await supabase.auth.getUser();

  return response;
}
