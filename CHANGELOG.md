# Bitácora de MiConjunto

Registro de hitos para seguimiento y versionamiento.

> **Regla de uso:** este archivo se actualiza **solo cuando el usuario lo solicita**.
> No se modifica automáticamente en cada cambio. El detalle fino vive en el
> historial de git; aquí van los resúmenes que sirven para revisar avance.

## Cómo se versiona

- Cada hito se marca con una **etiqueta de git** (`v0.1`, `v0.2`, …) y su fecha.
- Una versión agrupa un conjunto de cambios que tiene sentido revisar junto;
  **no** se etiqueta cada commit.
- Mientras el proyecto no tenga usuarios reales, la numeración se queda en `0.x`.

### Versiones publicadas

| Versión | Fecha | Hito | Commit |
|---|---|---|---|
| `v0.4` | 2026-10-29 | Operación: Admin, auditoría y unidades | `6494898` |
| `v0.3` | 2026-10-29 | Cuotas de administración y rol Admin | `abb37ec` |
| `v0.2` | 2026-10-29 | A producción: GitHub y Vercel | `b89c11f` |
| `v0.1` | 2026-10-29 | Fundación: app, base de datos y propuesta | `e576c49` |

Las etiquetas están publicadas en el repositorio. `git show v0.3` muestra el
resumen del hito sin salir de la terminal.

---

## v0.4 · 2026-10-29 — Operación

**Entregado**

- Área de Admin: lista de conjuntos, apertura de accesos de soporte con motivo y
  caducidad de 1 a 24 horas, cierre anticipado e historial de accesos.
- Auditoría para la Administración del conjunto: quién accedió, cuándo, por qué y
  hasta cuándo, con estado del acceso.
- Módulo de unidades: listado con coeficiente acumulado, alta de unidades con
  validaciones y alta de torres.
- Enrutamiento por rol: Admin al área de plataforma, Administración al panel del
  conjunto.
- Esta bitácora.

**Decisiones**

- El acceso de soporte es de solo lectura y caduca solo; el Admin no modifica datos
  del conjunto.
- Cada conjunto puede tener varias torres o ninguna.

---

## v0.3 · 2026-10-29 — Reglas del dinero y de los roles

**Entregado**

- Se retiró «alícuota» como nombre de módulo: ahora es **cuota de administración**,
  fijada por unidad según su coeficiente, con importación desde Excel y vista previa.
- Separación entre **Administración del conjunto** y **Admin** de la plataforma,
  con acceso de soporte temporal, motivado y auditado.
- Migración de base de datos con el rol `admin`, la tabla de accesos y las políticas
  ampliadas.
- Propuesta v1.2 (cuotas) y v1.3 (roles).

**Decisiones**

- La cuota se fija por periodo y no se recalcula hacia atrás.
- Si la suma de cuotas no cuadra con el valor total, el sistema avisa y deja la
  diferencia registrada; no bloquea.

---

## v0.2 · 2026-10-29 — A producción

**Entregado**

- Repositorio privado en GitHub y despliegue en Vercel con dominio propio.
- Despliegue automático en cada push a `main`.
- Corrección del empaquetado que rompía el build en Vercel (patrones de exclusión
  sin anclar a la raíz).
- Propuesta v1.1: arquitectura real con Supabase y Vercel, entornos y costos.

**Decisiones**

- Variables de entorno cargadas en Vercel para producción, vista previa y desarrollo.
- La clave secreta de Supabase nunca sale del servidor.

---

## v0.1 · 2026-10-29 — Fundación

**Entregado**

- Proyecto Next.js 16 con TypeScript y Tailwind 4.
- Documento de propuesta v1.0: problema, objetivos, siete módulos con reglas de
  negocio, roles, modelo de datos, arquitectura y plan por fases.
- Base de datos en Supabase: ocho tablas del núcleo con RLS, autenticación y perfil
  automático al crear usuario.
- Inicio de sesión, panel por rol y diagnóstico de conexión.

**Decisiones**

- El alcance excluye contabilidad y manejo de dinero; el estado de cuotas es
  informativo.
- Modelo preparado para varios conjuntos desde el inicio.
- El aislamiento se aplica en la base con RLS, no en la interfaz.

---

## Pendiente para la siguiente versión

- Personas y vinculaciones por unidad (propietarios, residentes, arrendatarios).
- Edición y desactivación de unidades.
- Importación de unidades desde Excel/CSV.
- Navegación del Admin en modo soporte.
- Módulos de portería, paquetería, reservas, PQRS, comunicados, asambleas y cuotas.

## Referencias

- Repositorio: `abotiva/miconjunto`, rama `main`.
- Producción: https://miconjunto-rose.vercel.app
- Propuesta vigente: `docs/propuesta/Propuesta_MiConjunto_v1.3.pdf`
