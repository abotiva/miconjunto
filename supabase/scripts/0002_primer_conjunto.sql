-- =============================================================================
-- MiConjunto · Datos iniciales · Primer conjunto y usuario administrador
-- -----------------------------------------------------------------------------
-- SOLO HAY QUE EDITAR UNA LÍNEA: v_nombre (más abajo).
--
-- El administrador se detecta solo: toma el usuario más reciente de auth.users.
-- Si quieres apuntar a otro correo, descomenta y escribe v_email.
--
-- Requisito: el usuario ya debe existir en Authentication → Users.
-- Es idempotente: si lo repites, no duplica el conjunto.
-- =============================================================================

do $$
declare
  -- ▼▼▼ EDITA SOLO ESTA LÍNEA ▼▼▼
  v_nombre text := 'Portal de San Pablo';
  -- ▲▲▲ con el nombre real del conjunto ▲▲▲

  -- Opcional: si hay varios usuarios y quieres elegir uno concreto.
  v_email text := null;

  v_nit          text := null;
  v_direccion    text := null;
  v_ciudad       text := null;
  v_departamento text := null;
  v_telefono     text := null;

  v_conjunto  uuid;
  v_afectados integer := 0;
begin
  if v_nombre = 'Portal de San Pablo' then
    raise notice 'Usando el nombre de ejemplo: Portal de San Pablo. Cámbialo si tu conjunto se llama distinto.';
  end if;

  -- 1. Resolver el administrador ------------------------------------------------
  if v_email is null then
    select email into v_email
    from auth.users
    order by created_at desc
    limit 1;
  end if;

  if v_email is null then
    raise exception 'No hay usuarios en auth.users. Crea el administrador en Authentication → Users y vuelve a ejecutar.';
  end if;

  raise notice 'Administrador: %', v_email;

  -- 2. Conjunto ------------------------------------------------------------------
  select id into v_conjunto
  from public.conjuntos
  where lower(nombre) = lower(v_nombre)
  limit 1;

  if v_conjunto is null then
    insert into public.conjuntos (nombre, nit, direccion, ciudad, departamento, telefono, email)
    values (v_nombre, v_nit, v_direccion, v_ciudad, v_departamento, v_telefono, v_email)
    returning id into v_conjunto;
    raise notice 'Conjunto creado: % (%)', v_nombre, v_conjunto;
  else
    raise notice 'El conjunto ya existía: % (%)', v_nombre, v_conjunto;
  end if;

  -- 3. Perfil del administrador ----------------------------------------------------
  update public.perfiles
     set conjunto_id = v_conjunto,
         rol = 'administracion',
         activo = true
   where lower(email) = lower(v_email);
  get diagnostics v_afectados = row_count;

  -- Si el usuario se creó antes de la migración, no tiene perfil: lo creamos.
  if v_afectados = 0 then
    insert into public.perfiles (id, conjunto_id, rol, email, nombres)
    select u.id,
           v_conjunto,
           'administracion',
           u.email,
           coalesce(u.raw_user_meta_data ->> 'nombres', split_part(u.email, '@', 1))
    from auth.users u
    where lower(u.email) = lower(v_email)
    on conflict (id) do update
      set conjunto_id = excluded.conjunto_id,
          rol = 'administracion',
          activo = true;
    get diagnostics v_afectados = row_count;
  end if;

  if v_afectados = 0 then
    raise exception 'No se pudo crear el perfil para %. Revisa que el usuario exista.', v_email;
  end if;

  raise notice 'Perfil de administración listo para: %', v_email;
end $$;

-- 4. Comprobación ------------------------------------------------------------------
select c.nombre  as conjunto,
       c.id      as conjunto_id,
       p.email   as administrador,
       p.rol
from public.conjuntos c
left join public.perfiles p on p.conjunto_id = c.id
order by c.creado_en;
