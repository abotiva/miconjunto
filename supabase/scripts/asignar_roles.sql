-- =============================================================================
-- MiConjunto · Asignación de roles por correo
-- -----------------------------------------------------------------------------
-- Deja las dos cuentas en su lugar:
--   · una cuenta con rol 'administracion' y el conjunto asignado
--   · una cuenta con rol 'admin' y sin conjunto
--
-- ANTES DE EJECUTAR: edita los dos correos de abajo.
-- No confundas esta cuenta con la del script 0002, que asigna el Administración
-- al usuario más reciente. Este script es explícito y no adivina.
-- =============================================================================

do $$
declare
  -- ▼▼▼ EDITA ESTOS DOS CORREOS ▼▼▼
  v_email_administracion text := 'administracion@ejemplo.com';
  v_email_admin          text := 'admin@ejemplo.com';
  -- ▲▲▲

  v_conjunto  uuid;
  v_afectados integer;
begin
  if v_email_administracion = 'administracion@ejemplo.com'
     or v_email_admin = 'admin@ejemplo.com' then
    raise exception 'Edita los dos correos con los reales antes de ejecutar.';
  end if;

  if lower(v_email_administracion) = lower(v_email_admin) then
    raise exception 'Los dos correos son iguales: una cuenta no puede ser Administración y Admin a la vez.';
  end if;

  select id into v_conjunto
  from public.conjuntos
  order by creado_en
  limit 1;

  if v_conjunto is null then
    raise exception 'No hay ningún conjunto creado. Ejecuta antes 0002_primer_conjunto.sql.';
  end if;

  -- 1. Administración del conjunto ------------------------------------------------
  update public.perfiles
     set rol = 'administracion',
         conjunto_id = v_conjunto,
         unidad_id = null,
         activo = true
   where lower(email) = lower(v_email_administracion);
  get diagnostics v_afectados = row_count;

  if v_afectados = 0 then
    raise warning 'No existe ninguna cuenta con el correo %.', v_email_administracion;
  else
    raise notice 'Administración del conjunto: %', v_email_administracion;
  end if;

  -- 2. Admin de plataforma ---------------------------------------------------------
  update public.perfiles
     set rol = 'admin',
         conjunto_id = null,
         unidad_id = null,
         activo = true
   where lower(email) = lower(v_email_admin);
  get diagnostics v_afectados = row_count;

  if v_afectados = 0 then
    raise warning 'No existe ninguna cuenta con el correo %.', v_email_admin;
  else
    raise notice 'Admin de plataforma: %', v_email_admin;
  end if;
end $$;

-- Comprobación
select p.email,
       p.rol,
       coalesce(c.nombre, '—') as conjunto,
       p.activo
from public.perfiles p
left join public.conjuntos c on c.id = p.conjunto_id
order by p.rol, p.email;
