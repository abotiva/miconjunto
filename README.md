# MiConjunto

Plataforma web para la administración de un conjunto residencial: unidades y
residentes, portería y paquetería, reservas de zonas comunes, PQRS,
comunicados, asambleas y cuotas de administración.

**Fuera de alcance por decisión de diseño:** contabilidad, manejo de dinero,
pasarela de pagos y facturación. El módulo de cuotas fija el valor por unidad e informa el estado de pago, sin mover dinero.

## Enlaces

| Recurso | Ubicación |
|---|---|
| Producción | https://miconjunto-w6gy.onrender.com |
| Panel de Render | https://dashboard.render.com/web/srv-dc29frifngtc73aq0e5g |
| Repositorio | https://github.com/abotiva/miconjunto |
| Supabase | proyecto `tebgroavefybadveomsr` |
| Propuesta | [`docs/propuesta/Propuesta_MiConjunto_v1.3.pdf`](docs/propuesta/Propuesta_MiConjunto_v1.3.pdf) |
| Diseño | [`docs/diseno/Implementacion_Mirador_v1.md`](docs/diseno/Implementacion_Mirador_v1.md) |
| Despliegue | [`docs/Despliegue_Render_v1.md`](docs/Despliegue_Render_v1.md) |

## Stack

- **Next.js 16** (App Router, Turbopack) con TypeScript.
- **Tailwind CSS 4** para estilos.
- **Supabase** (PostgreSQL + Auth + RLS) como base de datos.
- **Render** (Web Service con Node) para el despliegue, con auto-deploy desde `main`.

## Estructura

```
app/
  page.tsx              página de inicio pública (estática)
  ingresar/             formulario de entrada (Server Action)
  panel/                área privada, protegida por sesión y rol
    unidades/           inventario, ficha de unidad, residentes, vehículos y mascotas
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
scripts/                utilidades de conexión
docs/propuesta/         propuesta funcional y técnica (DOCX y PDF)
docs/diseno/            propuestas, decisión e implementación del sistema visual
```

## Desarrollo local

Requiere **Node 20.9 o superior**.

```powershell
npm install
npm run dev          # http://localhost:3000
npm run build        # build de producción
npm run check:supabase
```

Variables de entorno: copiar `.env.local.example` a `.env.local` y completar.
El archivo `.env.local` está en `.gitignore` y nunca se sube.

## Despliegue

El proyecto se publica en **Render**: <https://miconjunto-w6gy.onrender.com>.
Cada push a `main` despliega en producción de forma automática, en unos dos
minutos. No hay vistas previas por rama ni por pull request.

| Ajuste | Valor |
|---|---|
| Tipo | Web Service, runtime Node |
| Build | `npm ci && npm run build` |
| Inicio | `npm start` |
| Región | Virginia (cercana a Supabase `us-east-1`) |

Las variables de entorno, el rollback, el comportamiento del plan gratuito y la
solución de errores comunes están en
[`docs/Despliegue_Render_v1.md`](docs/Despliegue_Render_v1.md).

## Base de datos

Las migraciones se ejecutan a mano en Supabase → SQL Editor, **en orden**:

| # | Archivo | Contenido |
|---|---|---|
| 1 | `supabase/migrations/0001_nucleo.sql` | Tablas, índices y políticas RLS |
| 2 | `supabase/scripts/0002_primer_conjunto.sql` | Conjunto inicial y administrador |
| 3 | `supabase/migrations/0003_admin_soporte.sql` | Rol de plataforma y accesos de soporte |
| 4 | `supabase/migrations/0004_auditoria_soporte.sql` | Auditoría de soporte visible para la Administración |
| 5 | `supabase/migrations/0005_porteria.sql` | Visitas, paquetes, novedades y vista de movimientos |
| 6 | `supabase/migrations/0006_endurecer_seguridad.sql` | Alta de usuarios, funciones auxiliares y políticas de perfiles |
| 7 | `supabase/migrations/0007_integridad_unidades.sql` | Integridad entre conjuntos, un representante por unidad, escritura solo para Administración |

Detalles en [`supabase/README.md`](supabase/README.md).

## Roles

| Rol | Alcance |
|---|---|
| `administracion` | Todo su conjunto: unidades, personas, configuración. |
| `porteria` | Opera visitas, paquetería y novedades; lectura de unidades y personas. |
| `residente` | Solo su unidad, sus reservas y sus PQRS. |
| `admin` | Plataforma. Entra a un conjunto solo mientras tenga un acceso de soporte activo y auditado. |

Todas las tablas tienen RLS activo; ningún rol anónimo ve datos.

### Seguridad de las cuentas

- Un usuario nuevo se crea siempre como `residente` y sin conjunto.
  `rol` y `conjunto_id` solo se toman de `app_metadata`, que el cliente no puede
  escribir. Quien crea usuarios lo hace desde el servidor.
- Un residente no puede cambiar su propia unidad, ni la Administración puede
  asignar el rol `admin`.
- Las unidades no se borran: se desactivan, para conservar el historial de
  paquetería y visitas.
- Con el registro abierto en Supabase Auth cualquiera podría crear una cuenta.
  Mantenerlo **desactivado** (Authentication → Sign In / Providers).

## Estado

- [x] Base de datos con RLS
- [x] Autenticación y sesión
- [x] Panel protegido
- [x] Despliegue en producción (Render)
- [x] Unidades y residentes: inventario, filtros, edición, ficha con vinculaciones, vehículos y mascotas
- [ ] Unidades: carga masiva por CSV e invitación de usuarios por correo
- [ ] Portería y paquetería: base de datos lista (0005), falta la interfaz
- [ ] Reservas, PQRS, comunicados y asambleas
- [ ] Cuotas de administración
