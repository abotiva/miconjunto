# MiConjunto

Plataforma web para la administración de un conjunto residencial: unidades y
residentes, portería y paquetería, reservas de zonas comunes, PQRS,
comunicados, asambleas y cuotas de administración.

**Fuera de alcance por decisión de diseño:** contabilidad, manejo de dinero,
pasarela de pagos y facturación. El módulo de cuotas fija el valor por unidad e informa el estado de pago, sin mover dinero.

## Enlaces

| Recurso | Ubicación |
|---|---|
| Producción | https://miconjunto-rose.vercel.app |
| Repositorio | https://github.com/abotiva/miconjunto |
| Supabase | proyecto `tebgroavefybadveomsr` |
| Propuesta | [`docs/propuesta/Propuesta_MiConjunto_v1.3.pdf`](docs/propuesta/Propuesta_MiConjunto_v1.3.pdf) |
| Diseño | [`docs/diseno/Implementacion_Mirador_v1.md`](docs/diseno/Implementacion_Mirador_v1.md) |
| Despliegue | [`docs/Despliegue_Vercel_v1.md`](docs/Despliegue_Vercel_v1.md) |

## Stack

- **Next.js 16** (App Router, Turbopack) con TypeScript.
- **Tailwind CSS 4** para estilos.
- **Supabase** (PostgreSQL + Auth + RLS) como base de datos.
- **Vercel** para despliegue, con auto-deploy desde `main`.

## Estructura

```
app/
  page.tsx              página de inicio pública (estática)
  ingresar/             formulario de entrada (Server Action)
  panel/                área privada, protegida por sesión y rol
  admin/                área de plataforma (rol Admin)
  estado/               diagnóstico de conexión con Supabase
  layout.tsx            metadatos y base tipográfica
components/
  icons.tsx             iconografía SVG del producto
  landing/              inicio: cabecera, vista previa y tarjetas por rol
  panel/shell.tsx       navegación lateral, topbar y menú móvil
utils/supabase/
  env.ts                lectura validada de las variables de entorno
  server.ts             cliente para Server Components y Actions
  client.ts             cliente para Client Components
  proxy.ts              refresco de sesión (invocado desde proxy.ts raíz)
proxy.ts                equivalente a middleware.ts en Next 16
supabase/
  migrations/           esquema SQL, se ejecuta en el SQL Editor
  scripts/              datos iniciales
scripts/                utilidades de conexión y despliegue
docs/propuesta/         propuesta funcional y técnica (DOCX y PDF)
docs/diseno/            propuestas, decisión e implementación del sistema visual
```

## Desarrollo local

```powershell
npm install
npm run dev          # http://localhost:3000
npm run build        # build de producción
npm run check:supabase
```

Variables de entorno: copiar `.env.local.example` a `.env.local` y completar.
El archivo `.env.local` está en `.gitignore` y nunca se sube.

## Despliegue

Cada push a `main` publica en producción (<https://miconjunto-rose.vercel.app>) y
deja el estado del commit en GitHub; las ramas y pull requests generan una vista
previa con URL propia. También se puede publicar a mano:

```powershell
npm run deploy:preview   # revisión, no toca producción
npm run deploy           # producción
```

Variables, rollback y exclusiones en
[`docs/Despliegue_Vercel_v1.md`](docs/Despliegue_Vercel_v1.md).

## Base de datos

Las migraciones se ejecutan a mano en Supabase → SQL Editor, en orden:

1. `supabase/migrations/0001_nucleo.sql` — tablas, índices y políticas RLS.
2. `supabase/scripts/0002_primer_conjunto.sql` — conjunto inicial y administrador.

Detalles en [`supabase/README.md`](supabase/README.md).

## Roles

| Rol | Alcance |
|---|---|
| `administracion` | Todo su conjunto: unidades, personas, configuración. |
| `porteria` | Opera visitas, paquetería y novedades; lectura de unidades. |
| `residente` | Solo su unidad, sus reservas y sus PQRS. |

Todas las tablas tienen RLS activo; ningún rol anónimo ve datos.

## Estado

- [x] Base de datos con RLS
- [x] Autenticación y sesión
- [x] Panel protegido
- [x] Despliegue en producción
- [ ] Módulo de unidades y residentes
- [ ] Portería y paquetería
- [ ] Reservas, PQRS, comunicados y asambleas
