import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseKey, supabaseUrl } from "./env";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * La sesión viaja en cookies; `proxy.ts` se encarga de refrescarla.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Se ignoran los intentos de escritura desde un Server Component:
          // la sesión se refresca en proxy.ts, no aquí.
        }
      },
    },
  });
}
