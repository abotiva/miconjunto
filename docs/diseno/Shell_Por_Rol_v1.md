# Shell por rol · implementación v1

**Fecha:** 3 de noviembre de 2026
**Base:** sistema Mirador con el tono cálido de Patio para el residente.
**Alcance:** navegación, tema, inicio y guardas de ruta por rol. No incluye los
módulos de visitas, paquetería, novedades, cuotas, reservas ni comunicados.

---

## Qué cambió

Antes había un solo shell y un solo inicio: todos los roles veían el panel de
administración. Ahora el rol decide **qué se ve**, **cómo se ve** y **a dónde
llega cada usuario al entrar**.

| Pieza | Archivo | Cambio |
|---|---|---|
| Perfil y guardas | [`utils/auth/perfil.ts`](../../utils/auth/perfil.ts) | `obtenerPerfil()` y `exigirRol()`: una sola lectura de sesión y rol |
| Shell | [`components/panel/shell.tsx`](../../components/panel/shell.tsx) | Navegación por rol, subtítulo de marca y tema por rol |
| Layout | [`app/panel/layout.tsx`](../../app/panel/layout.tsx) | Pasa rol, conjunto, teléfono y unidad al shell |
| Inicio | [`app/panel/page.tsx`](../../app/panel/page.tsx) | Enruta al inicio de administración, portería o residente |
| Temas | [`app/globals.css`](../../app/globals.css) | `[data-tema="operacion"]` y `[data-tema="calido"]` |
| Directorio | [`app/panel/directorio/page.tsx`](../../app/panel/directorio/page.tsx) | Búsqueda real por unidad, placa o documento |
| Mi unidad | [`app/panel/mi-unidad/page.tsx`](../../app/panel/mi-unidad/page.tsx) | Personas, vehículos y mascotas de la unidad del residente |

Los inicios de administración y portería viven en
[`components/panel/vistas/`](../../components/panel/vistas/): el panel que ya
existía se movió sin cambios funcionales.

---

## Rutas

| Ruta | Administración | Portería | Residente |
|---|---|---|---|
| `/panel` | Panel del conjunto | Bitácora del turno | Inicio cálido |
| `/panel/unidades` | Alta y consulta | Consulta (sin formularios) | Redirige a `/panel` |
| `/panel/directorio` | Consulta | Consulta | Redirige a `/panel` |
| `/panel/mi-unidad` | Redirige a `/panel` | Redirige a `/panel` | Detalle de su unidad |
| `/panel/auditoria` | Accesos de soporte | Redirige a `/panel` | Redirige a `/panel` |
| `/admin` | Solo rol Admin de plataforma; los demás vuelven a `/panel` | | |

La guarda se aplica en el servidor, no solo en el menú: escribir la URL a mano
no salta el rol. El Admin de plataforma sigue fuera del conjunto y siempre cae
en `/admin`.

---

## Navegación

| Grupo | Administración | Portería | Residente |
|---|---|---|---|
| Inicio | Panel | Bitácora | Inicio |
| Operación | — | Visitas*, Paquetería*, Novedades* | — |
| Conjunto | Unidades, Reservas*, PQRS* | Unidades, Directorio, Vehículos* | Mi unidad |
| Comunidad | Comunicados*, Asambleas*, Cuotas* | — | Comunicados*, PQRS*, Asambleas* |
| Control | Auditoría | — | — |

`*` aparece como **pronto** y no es un enlace: un módulo que no existe no debe
abrir una pantalla vacía.

---

## Tema

Los tres roles comparten componentes y tokens. El tema se activa con
`data-tema` en la raíz del shell y redefine variables CSS; por eso `bg-surface`
o `text-navy` cambian sin duplicar clases.

| Rol | `data-tema` | Fondo | Superficie | Acento |
|---|---|---|---|---|
| Administración | `claro` (sin atributo) | `#F4F7F8` | `#FFFFFF` | verde `#0E7A6B` |
| Portería | `operacion` | `#081924` | `#0E2735` | verde claro `#2FBFA6` |
| Residente | `calido` | `#F3EDE3` | `#FFFCF6` | terracota `#B44E2B` |

En portería el texto sobre el verde usa `on-teal` (`#06201D`) para conservar
contraste; en claro y cálido usa blanco.

---

## Inicios

### Administración

El panel existente: cuatro indicadores reales, unidades por torre, accesos de
soporte y últimas unidades. Los módulos que no existen siguen marcados `pronto`.

### Portería

- Reloj y franja del turno en hora de Bogotá, actualizados en el cliente.
- Cuatro cifras reales: unidades, personas, vehículos y mascotas.
- Bitácora vacía con explicación honesta: visitas, paquetería y novedades
  requieren tablas y políticas propias.
- Buscador que lleva al directorio.

### Residente

- Saludo y titular en serif; fondo hueso y acentos terracota.
- Coeficiente, área, torre y tipo de su unidad.
- Personas, vehículos y mascotas registrados en la unidad.
- Cuota y mural marcados `pronto`, sin cifras inventadas.
- Teléfono de portería del conjunto cuando está registrado.

---

## Verificación

1. `npm run build` compila y lista las rutas nuevas.
2. Con una cuenta de cada rol:
   - administración entra a `/panel` y ve Auditoría y Unidades con formularios;
   - portería entra a `/panel` en modo oscuro y no ve formularios en Unidades;
   - residente entra a `/panel` en tono cálido y solo ve su unidad.
3. Escribir `/panel/auditoria` con una cuenta de residente debe devolver al
   inicio, no un error.
4. `/panel/directorio?q=<placa>` debe encontrar el vehículo de la unidad.

Las capturas de las tres pantallas de diseño siguen en
[`roles/`](roles/); la implementación usa datos reales, por eso las pantallas se
ven más vacías mientras el conjunto no tenga registros.

---

## Siguiente paso

1. **Portería:** migración de `visitas`, `paquetes` y `novedades` con RLS por rol.
2. **Residente:** `cuotas` y `comunicados`, que son las dos piezas que sostienen
   su inicio.
3. **Administración:** `cuotas` para recuperar el gráfico principal del panel.
