# Base de datos · Supabase

Proyecto: `tebgroavefybadveomsr` (`https://tebgroavefybadveomsr.supabase.co`).

## Estructura

```
supabase/
  migrations/
    0001_nucleo.sql   conjuntos, torres, unidades, personas,
                      vinculaciones, vehículos, mascotas, perfiles
  README.md
```

Las migraciones son archivos SQL numerados. Se ejecutan **en orden** y una sola
vez; el archivo está escrito para poder repetirse sin duplicar nada (usa
`if not exists`, `drop ... if exists` y `on conflict`).

## Cómo ejecutar una migración

1. Abre el proyecto en [supabase.com/dashboard](https://supabase.com/dashboard).
2. **SQL Editor → New query**.
3. Copia el contenido completo del archivo y pulsa **Run**.
4. Debe responder `Success. No rows returned`.

No hace falta reiniciar nada: PostgREST recarga el esquema solo.

## Qué crea la migración 0001

| Tabla | Para qué |
|---|---|
| `conjuntos` | Datos del conjunto (nombre, NIT, dirección, coeficiente total). |
| `torres` | Agrupación de unidades; puede quedar vacía si el conjunto no tiene torres. |
| `unidades` | Apartamento, casa, local, parqueadero o depósito, con su coeficiente. |
| `personas` | Propietarios, residentes y autorizados. |
| `vinculaciones` | Relación persona–unidad con rol y vigencia. |
| `vehiculos`, `mascotas` | Bienes asociados a una unidad. |
| `perfiles` | Cuenta de `auth.users` con rol, conjunto y unidad. |

## Seguridad (RLS)

Todas las tablas tienen *Row Level Security* activado. Las reglas se apoyan en
cinco funciones `security definer` que leen el perfil del usuario autenticado:

- `mi_conjunto()` — conjunto al que pertenece.
- `mi_rol()` — `administracion`, `porteria` o `residente`.
- `mi_unidad()` — unidad del residente.
- `puedo_administrar()` — administración o portería.
- `soy_administracion()` — solo administración.

Resumen de accesos:

| Tabla | Administración | Portería | Residente |
|---|---|---|---|
| `conjuntos`, `torres` | Lee y edita | Lee | Lee (su conjunto) |
| `unidades` | Todo | Lee todas | Solo la suya |
| `personas`, `vinculaciones` | Todo | Todo | Solo las de su unidad |
| `vehiculos`, `mascotas` | Todo | Todo | Solo los de su unidad |
| `perfiles` | Todo su conjunto | Solo el suyo | Solo el suyo |

Ningún rol `anon` ve datos: el acceso requiere sesión iniciada.

## Verificar que quedó bien

Desde la raíz del proyecto:

```powershell
npm run check:supabase
```

Debe mostrar `API de datos · tabla lista y protegida`. También puedes abrir la
app en `http://localhost:3000`: el diagnóstico pasa de "falta crear el esquema"
a "tabla lista".

## Siguiente migración prevista (0002)

Visitas y autorizaciones, paquetería, zonas comunes y reservas. Se agrega cuando
el núcleo esté validado con datos reales.
