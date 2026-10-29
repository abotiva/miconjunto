/**
 * Verifica que la configuración de Supabase en .env.local sea válida y alcanzable.
 * No escribe nada ni modifica datos: solo hace peticiones de lectura.
 *
 *   node scripts/check-supabase.mjs
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(file) {
  const env = {};
  if (!existsSync(file)) return env;
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) env[key] = value;
  }
  return env;
}

const file = join(root, ".env.local");
const env = { ...loadEnv(join(root, ".env.local.example")), ...loadEnv(file) };

const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const key =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const service = env.SUPABASE_SERVICE_ROLE_KEY || "";

const checks = [];
const add = (name, ok, detail) => checks.push({ name, ok, detail });

add("Archivo .env.local", existsSync(file),
  existsSync(file) ? "encontrado" : "no existe: cópialo de .env.local.example");
add("NEXT_PUBLIC_SUPABASE_URL",
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url),
  url || "vacía o con formato inválido");
add("Clave pública",
  key.startsWith("sb_publishable_") || key.startsWith("eyJ"),
  key ? `${key.slice(0, 16)}… (${key.length} caracteres)` : "vacía");
add("Clave secreta (service_role)", Boolean(service),
  service ? "definida en .env.local (solo servidor)" : "vacía: hará falta para migraciones y tareas administrativas");
add("SUPABASE_DB_URL", Boolean(env.SUPABASE_DB_URL),
  env.SUPABASE_DB_URL ? "definida" : "vacía: hará falta para migraciones");

async function probe(path, headers) {
  const started = Date.now();
  try {
    const res = await fetch(`${url}${path}`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    return { status: res.status, ms: Date.now() - started, body: await res.text() };
  } catch (error) {
    return { status: 0, ms: Date.now() - started, error: String(error?.message || error) };
  }
}

if (url && key) {
  const auth = await probe("/auth/v1/health", { apikey: key });
  add("Auth (/auth/v1/health)", auth.status === 200,
    auth.status ? `HTTP ${auth.status} · ${auth.ms} ms` : auth.error);

  // Consultar una tabla inexistente es la prueba correcta: si la autenticación
  // funciona, PostgREST responde PGRST205 en lugar de 401. Si la tabla ya existe
  // pero el rol anónimo no tiene permiso (42501), también significa que la
  // petición llegó a la base de datos.
  const data = await probe("/rest/v1/unidades?select=id&limit=1", { apikey: key });
  const body = data.body || "";
  const reachedDb =
    data.status === 200 ||
    body.includes("PGRST205") ||
    body.includes("42501") ||
    body.includes("permission denied");
  const detail =
    data.status === 0
      ? data.error
      : reachedDb
        ? body.includes("PGRST205")
          ? `HTTP ${data.status} · ${data.ms} ms · falta crear el esquema`
          : `HTTP ${data.status} · ${data.ms} ms · tabla lista y protegida`
        : `HTTP ${data.status} · ${body.slice(0, 120)}`;
  add("API de datos (/rest/v1)", reachedDb, detail);

  add("Referencia del proyecto", Boolean(url), url.replace(/^https:\/\//, "").split(".")[0]);
} else {
  add("Conexión", false, "faltan URL o clave pública; no se intentó conectar");
}

const width = Math.max(...checks.map((c) => c.name.length));
console.log("\nVerificación de Supabase\n" + "─".repeat(width + 46));
for (const c of checks) {
  console.log(`${c.ok ? "OK   " : "FALLA"}  ${c.name.padEnd(width)}  ${c.detail}`);
}
console.log("");

const failed = checks.filter((c) => !c.ok).length;
console.log(failed ? `${failed} verificación(es) con problema.\n` : "Todo listo: la configuración carga y el proyecto responde.\n");
process.exitCode = failed ? 1 : 0;
