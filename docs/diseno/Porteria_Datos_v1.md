# Portería · datos v1

**Fecha:** 4 de noviembre de 2026
**Archivo:** [`supabase/migrations/0005_porteria.sql`](../../supabase/migrations/0005_porteria.sql)
**Estado:** migración escrita y revisada. **No aplicada todavía**: falta
ejecutarla en el SQL Editor de Supabase y probarla con las cuentas reales.
**Alcance:** solo datos (tablas, políticas y funciones). No toca la interfaz:
la bitácora sigue mostrando el estado vacío hasta el paso 2.

---

## Qué crea

| Objeto | Para qué |
|---|---|
| `visitas` | Quién entra, con qué autorización, cuántas personas y a qué hora sale |
| `paquetes` | Recepción, tiempo de espera y entrega con nombre de quien recibe |
| `novedades` | Reportes del turno con categoría, prioridad y cierre |
| `movimientos_turno` | Vista que unifica las tres para la bitácora |
| `autorizar_visita()`, `cancelar_visita()` | Las dos acciones del residente |
| `turno_actual()` | Turno vigente en hora de Bogotá |

No modifica ninguna tabla existente: solo agrega.

### Campos que importan

**`visitas`** — `conjunto_id`, `unidad_id` (puede ir vacío para visitas a
administración o áreas comunes), `nombre_visitante`, `documento`, `tipo`
(`peatonal` / `vehicular`), `placa`, `personas`, `motivo`, `estado`
(`esperada` → `dentro` → `salio`, o `cancelada`), `entrada_en`, `salida_en`,
`autorizada_por` y `registrada_por`.

**`paquetes`** — `unidad_id` obligatorio, `transportadora`, `guia`,
`descripcion`, `cantidad`, `estado` (`recibido` / `entregado` / `devuelto`),
`recibido_por`, `recibido_en`, `entregado_a`, `entregado_por`, `entregado_en`.
El tiempo de espera se calcula restando las dos fechas: no se guarda como campo
porque se desactualiza solo.

**`novedades`** — `turno`, `categoria` (`seguridad`, `aseo`, `mantenimiento`,
`convivencia`, `otro`), `prioridad`, `descripcion`, `ubicacion`, `estado`
(`abierta` / `en_revision` / `cerrada`), `reportada_por`, `atendida_por`,
`cerrada_en` y `cierre_nota`.

---

## Cinco decisiones

1. **La bitácora es una vista, no una cuarta tabla.** `movimientos_turno`
   unifica visitas, paquetes y novedades con las columnas `clase`, `estado`,
   `referencia`, `detalle`, `unidad_id`, `ocurrido_en` y `responsable_id`. Si
   fuera una tabla habría que escribir dos veces cada movimiento y tarde o
   temprano se desincronizan. La vista usa `security_invoker`, así que hereda el
   RLS de cada tabla: el residente que la consulte no ve más de lo suyo.

2. **Las horas y la autoría las pone el servidor.** Un disparador sella
   `entrada_en` al pasar a «dentro», `salida_en` al salir, `entregado_en` al
   entregar y `cerrada_en` al cerrar. Si el cliente manda otra hora, se ignora.
   Igual con `registrada_por`, `recibido_por`, `reportada_por` y `atendida_por`:
   salen de `auth.uid()`, no del formulario.

3. **El residente no puede saltarse su propio límite.** Aunque mande
   `estado: 'dentro'`, el disparador lo devuelve a `esperada`; y la política de
   inserción exige que la unidad sea la suya y que la autorización esté firmada
   por él. No puede editar ni borrar visitas: autoriza y cancela por RPC.

4. **Nada se borra.** Los permisos no incluyen `delete`: una visita se cancela,
   un paquete se entrega o se devuelve, una novedad se cierra. El registro queda.

5. **El turno es colombiano.** `turno_actual()` usa `America/Bogota` con las
   mismas franjas del reloj de la pantalla: 06:00–14:00, 14:00–22:00 y
   22:00–06:00.

Dos reglas de negocio quedaron como restricciones de la base, con mensaje claro
al usuario: una visita vehicular sin placa no entra, y un paquete no puede
marcarse entregado sin decir a quién se le entregó.

---

## Accesos por rol

| Tabla | Administración | Portería | Residente | Admin de plataforma |
|---|---|---|---|---|
| `visitas` | Lee y edita | Lee, registra y edita | Solo las de su unidad; autoriza y cancela | Nada sin acceso de soporte |
| `paquetes` | Lee y edita | Lee, recibe y entrega | Solo los de su unidad, en lectura | Nada sin acceso de soporte |
| `novedades` | Lee, reporta y cierra | Lee, reporta y cierra | No las ve | Nada sin acceso de soporte |
| `movimientos_turno` | Todo el conjunto | Todo el conjunto | Solo visitas y paquetes de su unidad | Nada sin acceso de soporte |

El residente **no** ve novedades: son la bitácora interna del turno. Lo que él
reporta entra por PQRS, que es la migración siguiente de ese lado.

---

## Funciones del residente

```sql
-- Autorizar: devuelve el id de la visita, que queda en «esperada»
select public.autorizar_visita(
  p_nombre   => 'Ana Gómez',
  p_documento => 'CC 1023456789',
  p_tipo     => 'peatonal',
  p_personas => 1,
  p_motivo   => 'Visita familiar'
);

-- Vehicular: la placa es obligatoria
select public.autorizar_visita('Carlos Ruiz', null, 'vehicular', 'KLM 903', 2, 'Domicilio');

-- Cancelar: solo si aún no ha entrado
select public.cancelar_visita('<uuid de la visita>');
```

Ambas son `security definer` porque el residente no tiene permiso de escritura
sobre la tabla. Validan dentro: conjunto, unidad, autoría y estado. La ejecución
se retiró de `public` y de `anon`.

---

## Cómo aplicarla

1. **Supabase → SQL Editor → New query.**
2. Pegar completo [`0005_porteria.sql`](../../supabase/migrations/0005_porteria.sql) y **Run**.
   Debe responder `Success. No rows returned`.
3. Es idempotente: se puede volver a ejecutar sin duplicar tipos, tablas,
   políticas ni disparadores.

**Comprobaciones después de aplicar:**

```sql
-- 1. Las tres tablas con RLS activo
select relname, relrowsecurity
  from pg_class
 where relname in ('visitas', 'paquetes', 'novedades');

-- 2. La bitácora responde (con sesión de portería)
select clase, estado, referencia, ocurrido_en
  from public.movimientos_turno
 order by ocurrido_en desc
 limit 20;

-- 3. El turno calculado
select public.turno_actual();
```

Luego, con un residente real: `autorizar_visita` debe devolver un id y la visita
debe verse en `visitas` como `esperada` con `unidad_id` igual a la del perfil.
Con portería: pasar esa visita a `dentro` debe llenar `entrada_en`, y a `salio`
debe llenar `salida_en`.

---

## Lo que sigue

**Paso 2 · Pantalla del turno.** Reemplazar el estado vacío de
[`porteria.tsx`](../../components/panel/vistas/porteria.tsx) por la bitácora
real: tres indicadores (visitas dentro, paquetes por entregar, novedades
abiertas), la lista de `movimientos_turno`, alta de visita en tres campos,
recepción y entrega de paquete en un clic y novedad que se archiva al cambiar
de turno.

**Paso 3 · Lado del residente.** «Espero una visita» y «tienes un paquete» en
[`residente.tsx`](../../components/panel/vistas/residente.tsx), llamando a la
RPC y leyendo sus propias filas.

Ambos pasos caben en una rama `feat/porteria` con vista previa de Vercel antes de
producción.

---

## Límites conocidos

- **Sin probar en base real todavía.** El archivo está revisado a mano; la
  validación de sintaxis definitiva es ejecutarlo en Supabase.
- **Turnos fijos.** Si un conjunto trabaja 12 horas o turnos rotativos, hay que
  mover las franjas a una tabla de configuración.
- **Sin adjuntos.** Una novedad no guarda foto; el campo llegaría con Supabase
  Storage en una migración posterior.
- **Sin notificaciones.** El residente ve el paquete cuando entra a la app, no
  antes. Push y correo son otro módulo.
- **Entrega con nombre, no con firma.** `entregado_a` es texto; una firma
  capturada en pantalla requiere archivo y es parte del mismo módulo de
  adjuntos.
- **Auditoría fina pendiente.** Se sabe quién registró y quién entregó, pero no
  cada cambio de estado con su autor. Eso corresponde a una tabla de eventos
  cuando existan cuotas y PQRS, para no repetirla cuatro veces.
