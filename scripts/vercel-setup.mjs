/**
 * Prepara el proyecto en Vercel (ámbito personal) y deja el enlace local.
 *
 * Requiere VERCEL_TOKEN en el entorno. El script:
 *   1. Obtiene el usuario dueño del token.
 *   2. Crea el proyecto si no existe.
 *   3. Carga NEXT_PUBLIC_SUPABASE_* en production, preview y development.
 *   4. Escribe .vercel/project.json para que el CLI despliegue en el sitio correcto.
 *
 * No imprime valores secretos.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const token = process.env.VERCEL_TOKEN;
const NOMBRE = process.env.VERCEL_PROJECT_NAME || "miconjunto";

if (!token) {
  console.error("Falta VERCEL_TOKEN en el entorno.");
  process.exit(1);
}

async function api(path, init = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const raw = await res.text();
  let body = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }
  return { status: res.status, body };
}

function leerEnv(ruta) {
  const env = {};
  for (const linea of readFileSync(ruta, "utf8").split(/\r?\n/)) {
    const t = linea.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const usuario = await api("/v2/user");
if (usuario.status !== 200) {
  console.error("No se pudo identificar la cuenta:", usuario.status, usuario.body);
  process.exit(1);
}
const orgId = usuario.body.user.id;
console.log(`Cuenta: ${usuario.body.user.username} (${orgId})`);

const lista = await api("/v9/projects?limit=100");
let proyecto = (lista.body?.projects || []).find((p) => p.name === NOMBRE);

if (!proyecto) {
  const creado = await api("/v11/projects", {
    method: "POST",
    body: JSON.stringify({ name: NOMBRE, framework: "nextjs" }),
  });
  if (creado.status >= 300) {
    console.error("No se pudo crear el proyecto:", creado.status, creado.body);
    process.exit(1);
  }
  proyecto = creado.body;
  console.log(`Proyecto creado: ${proyecto.name} (${proyecto.id})`);
} else {
  console.log(`Proyecto existente: ${proyecto.name} (${proyecto.id})`);
}

// --- Variables de entorno -----------------------------------------------------
const env = leerEnv(join(root, ".env.local"));
const variables = [
  ["NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL],
  ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY],
].filter(([, valor]) => Boolean(valor));

const existentes = await api(`/v9/projects/${proyecto.id}/env`);
const yaDefinidas = new Set((existentes.body?.envs || []).map((e) => e.key));

for (const [key, value] of variables) {
  if (yaDefinidas.has(key)) {
    console.log(`Variable ya existente: ${key}`);
    continue;
  }
  const res = await api(`/v10/projects/${proyecto.id}/env`, {
    method: "POST",
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target: ["production", "preview", "development"],
    }),
  });
  console.log(
    res.status < 300
      ? `Variable cargada: ${key}`
      : `Error al cargar ${key}: ${res.status} ${JSON.stringify(res.body)}`,
  );
}

// --- Enlace local -------------------------------------------------------------
mkdirSync(join(root, ".vercel"), { recursive: true });
writeFileSync(
  join(root, ".vercel", "project.json"),
  JSON.stringify({ projectId: proyecto.id, orgId }, null, 2) + "\n",
);
console.log("Enlace local escrito en .vercel/project.json");
console.log(`PROJECT_ID=${proyecto.id}`);
console.log(`ORG_ID=${orgId}`);
