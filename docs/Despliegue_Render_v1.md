# Despliegue en Render · v1

MiConjunto se publica como un **Web Service** de Render, conectado al
repositorio `abotiva/miconjunto`, rama `main`.

- Producción: https://miconjunto-w6gy.onrender.com
- Panel: https://dashboard.render.com/web/srv-dc29frifngtc73aq0e5g
- Servicio: `miconjunto` · región Virginia · workspace «My Workspace»

## Configuración del servicio

| Ajuste | Valor |
|---|---|
| Runtime | Node |
| Repositorio | `https://github.com/abotiva/miconjunto` |
| Rama | `main` |
| Auto-deploy | Sí, en cada commit |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Previews de pull request | Desactivadas |
| Plan | Gratuito (ver «Plan y apagado») |

## Variables de entorno

Se editan en Render → servicio → **Environment**. Las `NEXT_PUBLIC_*` se
**incrustan al compilar**: después de cambiarlas hay que volver a desplegar
(**Manual Deploy → Deploy latest commit**), o el cambio no se refleja.

| Variable | Valor |
|---|---|
| `NODE_VERSION` | `22` (Next 16 exige Node 20.9 o superior) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tebgroavefybadveomsr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave publishable del proyecto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la misma clave publishable |

La clave publishable está en Supabase → Project Settings → API Keys. Es pública
por diseño, pero no se guarda en el repositorio. **Nunca** se carga la clave
`service_role` en variables `NEXT_PUBLIC_*`.

Basta con la variable que lea `utils/supabase/env.ts`; las dos de clave están
cargadas para evitar errores si cambia el nombre.

## Flujo de publicación

1. `git push origin main`.
2. Render detecta el commit, compila (`npm ci && npm run build`) y arranca.
3. Cuando el despliegue pasa a **Live**, la versión anterior se apaga.

Si el build falla, Render **no reemplaza** la versión que está en línea.

Antes de subir conviene ejecutar `npm run build` en local: así los errores de
tipos salen en la máquina y no en el despliegue.

## Autenticación (Supabase)

En Supabase → Authentication → URL Configuration:

- **Site URL:** `https://miconjunto-w6gy.onrender.com`
- **Redirect URLs:**
  - `https://miconjunto-w6gy.onrender.com/**`
  - `http://localhost:3000/**` (desarrollo local)

Si la URL de producción cambia (dominio propio, por ejemplo), hay que
actualizarla aquí o el inicio de sesión falla.

## Rollback

Render → servicio → **Events** (o **Deploys**) → abrir un despliegue anterior
que haya quedado en Live → **Rollback to this deploy**.

El rollback solo revierte el código. **No revierte la base de datos**: las
migraciones de Supabase se ejecutan aparte y son independientes.

## Logs y diagnóstico

- Render → servicio → **Logs** (build y ejecución).
- La ruta `/estado` de la propia aplicación comprueba la conexión con Supabase.

## Plan y apagado

En el plan gratuito el servicio **se apaga tras unos 15 minutos sin tráfico** y
la primera visita después tarda cerca de un minuto en responder. Es aceptable
para pruebas. Para uso real con residentes y portería conviene pasar a un plan
de pago (**Settings → Instance Type**).

Los límites y precios de Render cambian: confirmarlos en su página de planes.

## Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| El build falla con «Falta NEXT_PUBLIC_SUPABASE_URL» | La variable no está cargada. `.env.local` no se sube al repositorio. | Cargarla en Environment y volver a desplegar. |
| El inicio de sesión falla en producción | La URL de Render no está en Supabase. | Agregarla en Site URL y Redirect URLs. |
| Primera carga muy lenta | Plan gratuito apagado por inactividad. | Esperar, o pasar a un plan de pago. |
| El cambio de una variable no se ve | Las `NEXT_PUBLIC_*` se incrustan al compilar. | Manual Deploy → Deploy latest commit. |
| `npm ci` falla por el lock | `package.json` y `package-lock.json` no coinciden. | Ejecutar `npm install` en local y subir los dos archivos. |
