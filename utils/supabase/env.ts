const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!rawUrl) {
  throw new Error(
    "Falta NEXT_PUBLIC_SUPABASE_URL. Copia .env.local.example a .env.local y completa los valores.",
  );
}

if (!rawKey) {
  throw new Error(
    "Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY) en .env.local.",
  );
}

/** URL del proyecto sin barra final. */
export const supabaseUrl = rawUrl.replace(/\/+$/, "");

/**
 * Clave pública del proyecto. Es segura en el navegador: lo que protege los datos
 * son las políticas RLS de Supabase, no el secreto de esta clave.
 */
export const supabaseKey = rawKey;

/** Identificador del proyecto, tomado del subdominio. */
export const supabaseProjectRef = new URL(supabaseUrl).hostname.split(".")[0];
