/**
 * Despliega el proyecto a Vercel por API, al proyecto y ámbito indicados.
 *
 * Existe porque el CLI tomaba el ámbito del equipo activo de la configuración
 * global y omitía archivos al empaquetar. Aquí la lista de archivos es explícita
 * y verificable.
 *
 * Uso:
 *   VERCEL_TOKEN=... VERCEL_PROJECT_ID=prj_... node scripts/vercel-deploy.mjs
 */

import { readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const token = process.env.VERCEL_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID;

if (!token || !projectId) {
  console.error("Faltan VERCEL_TOKEN o VERCEL_PROJECT_ID.");
  process.exit(1);
}

/** Archivos que forman la aplicación (lista explícita, sin node_modules ni docs). */
const INCLUIR = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/globals.css",
  "app/estado/page.tsx",
  "app/ingresar/page.tsx",
  "app/ingresar/actions.ts",
  "app/ingresar/login-form.tsx",
  "app/panel/layout.tsx",
  "app/panel/page.tsx",
  "app/panel/actions.ts",
  "utils/supabase/env.ts",
  "utils/supabase/server.ts",
  "utils/supabase/client.ts",
  "utils/supabase/proxy.ts",
  "proxy.ts",
  "next.config.ts",
  "postcss.config.mjs",
  "tsconfig.json",
  "next-env.d.ts",
  "package.json",
  "package-lock.json",
];

const archivos = [];
for (const rel of INCLUIR) {
  const abs = join(root, rel.split("/").join(sep));
  try {
    const stat = statSync(abs);
    if (!stat.isFile()) throw new Error("no es archivo");
    archivos.push({
      file: rel,
      data: readFileSync(abs).toString("base64"),
      encoding: "base64",
    });
  } catch {
    console.error(`FALTA: ${rel}`);
    process.exit(1);
  }
}

console.log(`Archivos a desplegar: ${archivos.length}`);
for (const a of archivos) console.log("  ·", a.file);

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

const creado = await api("/v13/deployments", {
  method: "POST",
  body: JSON.stringify({
    name: "miconjunto",
    project: projectId,
    target: "production",
    files: archivos,
    projectSettings: { framework: "nextjs" },
  }),
});

if (creado.status >= 300) {
  console.error("Error al crear el despliegue:", creado.status, JSON.stringify(creado.body));
  process.exit(1);
}

const id = creado.body.id;
console.log(`Despliegue creado: ${id}`);

const inicio = Date.now();
let ultimoEstado = "";
while (Date.now() - inicio < 12 * 60 * 1000) {
  await new Promise((r) => setTimeout(r, 8000));
  const est = await api(`/v13/deployments/${id}`);
  const estado = est.body?.readyState || est.body?.status || "?";
  if (estado !== ultimoEstado) {
    console.log(`  estado: ${estado}`);
    ultimoEstado = estado;
  }
  if (estado === "READY") {
    console.log(`URL de producción: https://${est.body.url}`);
    console.log(`Alias del proyecto: https://miconjunto.vercel.app (si el dominio está libre)`);
    process.exit(0);
  }
  if (estado === "ERROR" || estado === "CANCELED") {
    console.error("El despliegue falló:", est.body?.errorMessage || "");
    process.exit(1);
  }
}

console.error("Tiempo de espera agotado; revisa el panel de Vercel.");
process.exit(1);
