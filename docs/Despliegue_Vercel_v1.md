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

Vercel también reporta el resultado en GitHub: el commit queda con el estado
`Vercel · success` o `failure` y un enlace al despliegue.

**Verificado:** el 4 de noviembre de 2026, el push de `416be37` a `main` produjo
un despliegue de producción en ~50 s y el estado del commit quedó en `success`.

### Manual, desde el equipo

```powershell
npm run deploy:preview   # URL única de revisión, no toca producción
npm run deploy           # publica en producción
```

Ambos usan el proyecto enlazado en `.vercel/project.json` y respetan
`.vercelignore`. La CLI necesita sesión iniciada (`npx vercel whoami`).

### Flujo de revisión: rama → vista previa → promover

Producción no se toca hasta que alguien mire la URL de revisión. Es el flujo
que conviene para todo cambio visible:

```powershell
git switch -c feat/mi-cambio
git add -A
git commit -m "…"
git push -u origin feat/mi-cambio
```

Vercel construye una **vista previa** de esa rama y la publica en una URL
propia. La dirección aparece en tres sitios:

| Dónde | Qué se ve |
|---|---|
| GitHub, en el commit | Chequeo `Vercel – miconjunto` con el enlace *Visit Preview* |
| Panel → *Deployments* | El despliegue marcado con la rama y el entorno *Preview* |
| Terminal | `npx vercel ls miconjunto` (últimos despliegues y su URL) |

Cuando la vista previa está aprobada hay dos caminos:

1. **Fusionar a `main`** (recomendado para trabajo normal): producción se
   reconstruye desde el commit de fusión y el historial queda limpio.
2. **Promover la vista previa** (`npx vercel promote <url-de-la-vista-previa>`
   o *Promote to Production* en el panel): el alias de producción apunta a ese
   build ya construido, sin recompilar. Sirve para un arreglo urgente o cuando
   lo revisado es exactamente lo que se quiere publicar.

Promover no congela nada: el siguiente push a `main` vuelve a publicar. Y como
el alias es estable, ninguna de las dos rutas cambia la dirección de los
residentes.

> **Aviso:** las vistas previas usan las mismas variables de Supabase que
> producción, es decir, **la misma base de datos**. Sirven para revisar diseño y
> lectura; no se prueban ahí borrados, cambios de rol ni nada destructivo.
> Cuando haga falta un entorno de pruebas real, se crea un segundo proyecto de
> Supabase y se cargan sus variables solo en *Preview*.

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
| `SITIO_URL` | Opcional. Dirección pública para las URLs absolutas de Open Graph; solo hace falta cuando exista dominio propio |

`SITIO_URL` no es obligatoria: sin ella, producción usa el alias de Vercel y
cada vista previa usa su propia dirección (así la tarjeta del enlace funciona
antes de promover).

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

## 6 · Tarjeta al compartir enlaces

Cuando alguien pega la dirección en WhatsApp, Slack o LinkedIn, el enlace
muestra una tarjeta con imagen. Esa imagen existe y se versiona con el código:

| Pieza | Archivo | Qué hace |
|---|---|---|
| Imagen | [`app/opengraph-image.png`](../app/opengraph-image.png) | 1200 × 630, PNG de 145 KB, por debajo del límite de 8 MB |
| Texto alternativo | [`app/opengraph-image.alt.txt`](../app/opengraph-image.alt.txt) | Se publica como `og:image:alt` |
| Fuente editable | [`docs/diseno/inicio/og/og.html`](diseno/inicio/og/og.html) | La maqueta real; el PNG es su captura |
| Metadatos | [`app/layout.tsx`](../app/layout.tsx) | `metadataBase` + `twitter.card = summary_large_image` |

Next.js detecta el archivo por convención y agrega solo `og:image`,
`og:image:type`, `og:image:width`, `og:image:height` y `og:image:alt`. Twitter
hereda la misma imagen y su texto alternativo, así que no hay que duplicarla.

**Para regenerarla** después de un cambio de marca, con el HTML abierto en
Chrome headless:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new `
  --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
  --window-size=1200,630 `
  --screenshot="app\opengraph-image.png" `
  "file:///C:/App%20Conjuntos/docs/diseno/inicio/og/og.html"
```

El HTML vive en `docs/` —que no se despliega— porque es material de diseño, no
código de la aplicación. La imagen sí viaja.

**Cómo comprobarla** antes de publicar: `npm run build`, luego `npm run start`
y revisar el HTML de `/` en busca de `og:image`. Debe ser una URL absoluta que,
al abrirla, devuelva `image/png` de 1200 × 630.

Dos advertencias honestas:

- **Las redes guardan la tarjeta en caché.** Si cambia la imagen, Facebook y
  LinkedIn pueden seguir mostrando la anterior; se fuerza con el *Sharing
  Debugger* de Meta. WhatsApp no ofrece forma de forzarlo: toma la versión nueva
  cuando le toca.
- **La tarjeta no se ve en local.** `localhost` no es accesible para los
  servidores de esas plataformas; la prueba real es la URL de la vista previa o
  la de producción.

---

## 7 · Estado

- [x] Proyecto creado y enlazado
- [x] Variables de Supabase en los tres entornos
- [x] Repositorio de GitHub conectado
- [x] Página de inicio pública (estática)
- [x] Imagen de Open Graph para compartir enlaces
- [ ] Dominio propio
- [ ] Analítica y monitoreo de errores
- [ ] Segundo proyecto de Supabase para las vistas previas

### Pendiente de decisión: dominio

Hoy la dirección de producción es `miconjunto-rose.vercel.app`. Un dominio
propio (`miconjunto.co` o similar) se agrega en *Settings → Domains* y requiere
acceso al DNS; mientras no exista, conviene tratar la URL de Vercel como
provisional y no imprimirla en documentos para residentes.
