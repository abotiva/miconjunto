# Bitácora de MiConjunto

Registro de hitos del proyecto para seguimiento y versionamiento.

> **Regla de uso:** este archivo se actualiza **solo cuando el usuario lo solicita**.
> No se modifica automáticamente en cada cambio. El detalle fino vive en el
> historial de git; aquí van los resúmenes que sirven para revisar avance.

---

## 2026-10-29 · Día 1 — De la propuesta a producción

### Propuesta y alcance

- Documento de propuesta completo (17 páginas): problema, objetivos, 7 módulos con
  reglas de negocio, roles, modelo de datos, arquitectura y plan por fases.
- Alcance delimitado: **sin contabilidad ni manejo de dinero**. El «reporte de pagos»
  quedó como estado de cuotas, sin pasarela, recaudo, intereses ni conciliación.
- Corrección de terminología: se eliminó «alícuota» como nombre de módulo. Se usa
  **cuota de administración** (valor mensual por unidad) y **coeficiente de
  copropiedad** (porcentaje de participación).
- Distinción entre **Administración del conjunto** (gobierna el edificio) y **Admin**
  (opera la plataforma), con acceso de soporte temporal, motivado y auditado.
- Tres revisiones del documento: v1.0 (original), v1.1 (infraestructura real),
  v1.2 (cuotas e importación), v1.3 (Administración vs Admin). Todas con DOCX y PDF.

### Infraestructura

- **Supabase**: proyecto creado, 8 tablas del núcleo, tabla de accesos de soporte,
  RLS activo con más de 17 políticas, autenticación por correo y contraseña.
- **Vercel**: proyecto desplegado en `miconjunto-rose.vercel.app`, variables de
  entorno en los tres ambientes y despliegue automático desde `main`.
- **GitHub**: repositorio privado `abotiva/miconjunto`, conectado a Vercel.
- **Aplicación**: Next.js 16 (App Router), TypeScript y Tailwind 4.

### Funcionalidad construida

- Inicio de sesión con Supabase Auth y sesión por cookies.
- Enrutamiento por rol: Admin → `/admin`; Administración → `/panel`.
- **Unidades y torres**: listado con coeficiente acumulado, alta de unidades con
  validaciones y alta de torres.
- **Área de Admin**: lista de conjuntos, apertura de accesos de soporte con motivo y
  caducidad (1 a 24 h), cierre anticipado e historial.
- **Auditoría** para la Administración del conjunto: quién accedió, cuándo, por qué y
  hasta cuándo.
- Página de diagnóstico de conexión con Supabase.

### Decisiones tomadas

- Modelo preparado para varios conjuntos (`conjunto_id` en todas las tablas).
- El aislamiento se aplica en la base con RLS, no en la interfaz.
- El Admin no ve datos sin un acceso de soporte vigente, y todo acceso queda visible
  para la Administración del conjunto.
- Las cuotas se fijan por periodo y se pueden importar desde Excel, con vista previa
  y validación de sumas.
- Para operar git se usa el binario que trae GitHub Desktop (no hay git en el PATH).

### Pendiente al cierre

- Personas y vinculaciones (propietarios, residentes, arrendatarios) por unidad.
- Edición y desactivación de unidades.
- Importación de unidades desde Excel/CSV.
- Navegación del Admin en modo soporte (lectura del conjunto con acceso activo).
- Módulos de portería, paquetería, reservas, PQRS, comunicados, asambleas y cuotas.

### Referencias

- Repositorio: `abotiva/miconjunto`, rama `main`, último commit del día `c8f5b33`.
- Producción: https://miconjunto-rose.vercel.app
- Propuesta vigente: `docs/propuesta/Propuesta_MiConjunto_v1.3.pdf`
