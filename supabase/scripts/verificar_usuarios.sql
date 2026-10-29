-- =============================================================================
-- MiConjunto · Verificación de usuarios y roles
-- -----------------------------------------------------------------------------
-- Ejecutar en el SQL Editor. Solo lee, no modifica nada.
-- Devuelve tres resultados: listado, resumen por rol e inconsistencias.
-- =============================================================================

-- 1. Listado completo -----------------------------------------------------------
select p.email,
       p.rol,
       coalesce(c.nombre, '—') as conjunto,
       p.activo,
       to_char(p.creado_en, 'YYYY-MM-DD HH24:MI') as creado
from public.perfiles p
left join public.conjuntos c on c.id = p.conjunto_id
order by p.rol, p.email;

-- 2. Resumen por rol -------------------------------------------------------------
select rol, count(*) as usuarios
from public.perfiles
group by rol
order by rol;

-- 3. Inconsistencias -------------------------------------------------------------
-- (una fila por cada caso que hay que corregir)
select p.email,
       p.rol,
       case
         when p.rol = 'admin' and p.conjunto_id is not null
           then 'El Admin no debe tener conjunto asignado'
         when p.rol <> 'admin' and p.conjunto_id is null
           then 'Este rol necesita un conjunto asignado'
         when not p.activo
           then 'La cuenta está desactivada'
         else 'revisar'
       end as problema
from public.perfiles p
where (p.rol = 'admin' and p.conjunto_id is not null)
   or (p.rol <> 'admin' and p.conjunto_id is null)
   or not p.activo;
