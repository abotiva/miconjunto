# Despliegue en Vercel — MiConjunto

**Fecha:** 4 de noviembre de 2026
**Proyecto:** `miconjunto` · cuenta `abotiva`
**Producción:** <https://miconjunto-rose.vercel.app>
**Panel:** <https://vercel.com/abotiva/miconjunto>

---

## 1 · Resumen

| Pieza | Valor |
|---|---|
| Proyecto (ID) | `miconjunto` · `prj_J6wKra3afuk40Kp9faNevOBrPaC6` |
| Repositorio | `abotiva/miconjunto` (rama `main`) |
| Framework | Next.js 16 (detección automática) |
| Node en Vercel | 26.x |
| Alias de producción | `miconjunto-rose.vercel.app` |
| Enlace local | `.vercel/project.json` (no se versiona) |

El proyecto ya existía: se creó con `scripts/vercel-setup.mjs` y desde entonces
los despliegues se hacían por CLI. La integración con GitHub está conectada
(`abotiva/miconjunto`), así que **un push a `main` publica en producción** y una
rama o un pull request generan una **vista previa** con URL propia.

Las URLs de cada despliegue incluyen el slug del ámbito
(`miconjunto-<hash>-motocare.vercel.app`); el alias estable es el de producción.

---

## 2 · Cómo se publica

### Automático (recomendado)

```powershell
git add -A
git commit -m "…"
git push origin main
```

Vercel construye y publica. El estado se ve en el panel y con:

```powershell
npx vercel ls miconjunto
```

### Manual, desde el equipo

```powershell
npm run deploy:preview   # URL única de revisión, no toca producción
npm run deploy           # publica en producción
```

Ambos usan el proyecto enlazado en `.vercel/project.json` y respetan
`.vercelignore`. La CLI necesita sesión iniciada (`npx vercel whoami`).

### Antes de publicar

```powershell
npm run build     # compila, valida TypeScript y lista las rutas
```

Si el build local falla, el de Vercel también. No hay pasos de migración
automáticos: las migraciones de Supabase se ejecutan a mano en el SQL Editor.

---

## 3 · Variables de entorno

Cargadas en Vercel para **Production, Preview y Development**:

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (la protegen las políticas RLS) |

No están en Vercel, porque la aplicación no las usa en runtime:
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` y las variables `SMTP_*`.
Si más adelante se envían correos desde el servidor, hay que agregarlas como
secretos (`vercel env add`).

`npm run check:supabase` valida la conexión desde local; `/estado` la valida en
el despliegue.

---

## 4 · Qué no viaja al despliegue

`.vercelignore` excluye del paquete:

- `docs/` — propuestas, capturas y documentos de diseño (por eso la página de
  inicio no enlaza a ellos).
- `supabase/` — migraciones y scripts SQL.
- `Conjunto_Residencial/` — carpeta ajena a este proyecto.
- `.env*`, `node_modules`, `.next`, `.npm-cache`, `*.md`.

Los patrones llevan `/` inicial a propósito: sin él, `supabase` también
excluiría `utils/supabase`, que sí es código de la aplicación.

---

## 5 · Volver atrás

Dos formas, ambas sin reconstruir:

1. **Panel** → *Deployments* → elegir un despliegue anterior → **Promote to
   Production**. El alias apunta de inmediato a esa versión.
2. **CLI** → `npx vercel rollback` (revierte al despliegue anterior de producción).

Los despliegues quedan disponibles ~90 días según el plan. Como el alias es
estable, revertir no cambia la URL que usan los residentes.

---

## 6 · Estado

- [x] Proyecto creado y enlazado
- [x] Variables de Supabase en los tres entornos
- [x] Repositorio de GitHub conectado
- [x] Página de inicio pública (estática)
- [ ] Dominio propio
- [ ] Analítica y monitoreo de errores
- [ ] Imagen de Open Graph para compartir enlaces

### Pendiente de decisión: dominio

Hoy la dirección de producción es `miconjunto-rose.vercel.app`. Un dominio
propio (`miconjunto.co` o similar) se agrega en *Settings → Domains* y requiere
acceso al DNS; mientras no exista, conviene tratar la URL de Vercel como
provisional y no imprimirla en documentos para residentes.
