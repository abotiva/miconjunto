-- 0006_endurecer_seguridad.sql (YA APLICADA en Supabase el 23-nov-2026 como "0003_endurecer_seguridad")
-- Corrige los hallazgos de la revisión de Supabase (23-nov-2026).
-- Es idempotente en lo posible y corre en una sola transacción.

begin;

-- ---------------------------------------------------------------------
-- 1. Trigger de alta de usuarios: ya no confía en metadatos del cliente.
--    rol y conjunto_id se leen de raw_app_meta_data, que el cliente NO puede
--    escribir (solo el servidor con service_role o el panel de Supabase).
--    Sin ese dato, el perfil queda como residente sin conjunto.
-- ---------------------------------------------------------------------
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_conjunto uuid;
  v_rol      public.rol_usuario;
begin
  v_conjunto := nullif(new.raw_app_meta_data ->> 'conjunto_id', '')::uuid;
  v_rol := coalesce(
    nullif(new.raw_app_meta_data ->> 'rol', '')::public.rol_usuario,
    'residente'
  );

  insert into public.perfiles (id, conjunto_id, rol, nombres, email)
  values (
    new.id,
    v_conjunto,
    v_rol,
    coalesce(new.raw_user_meta_data ->> 'nombres', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Función de trigger: nadie necesita llamarla por la API.
revoke execute on function public.crear_perfil_nuevo_usuario() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Funciones auxiliares de RLS: quitar acceso a anon.
--    authenticated conserva EXECUTE porque las políticas RLS las evalúan
--    con los privilegios de quien consulta.
-- ---------------------------------------------------------------------
create or replace function public.mi_persona()
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select persona_id from public.perfiles where id = auth.uid() and activo limit 1;
$$;

revoke execute on function public.es_admin_plataforma()    from public, anon;
revoke execute on function public.mi_conjunto()            from public, anon;
revoke execute on function public.mi_rol()                 from public, anon;
revoke execute on function public.mi_unidad()              from public, anon;
revoke execute on function public.mi_persona()             from public, anon;
revoke execute on function public.puedo_administrar()      from public, anon;
revoke execute on function public.soporte_activo(uuid)     from public, anon;
revoke execute on function public.soy_administracion()     from public, anon;

grant execute on function public.es_admin_plataforma()     to authenticated;
grant execute on function public.mi_conjunto()             to authenticated;
grant execute on function public.mi_rol()                  to authenticated;
grant execute on function public.mi_unidad()               to authenticated;
grant execute on function public.mi_persona()              to authenticated;
grant execute on function public.puedo_administrar()       to authenticated;
grant execute on function public.soporte_activo(uuid)      to authenticated;
grant execute on function public.soy_administracion()      to authenticated;

-- search_path fijo en la función del trigger de fechas.
alter function public.tocar_actualizado_en() set search_path = public;

-- ---------------------------------------------------------------------
-- 3. Políticas de perfiles
--    - Edición propia: además de rol y conjunto, no se puede cambiar
--      unidad_id ni persona_id. "is not distinct from" también funciona
--      cuando el valor es NULL (p. ej. el admin de plataforma sin conjunto).
--    - Edición por administración: no puede asignar el rol 'admin' ni
--      editar perfiles que ya son 'admin'.
--    - Se envuelven auth.uid() y las funciones en (select ...) para que se
--      evalúen una vez por consulta y no por fila.
-- ---------------------------------------------------------------------
drop policy if exists perfiles_edicion_propia on public.perfiles;
create policy perfiles_edicion_propia on public.perfiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and rol = (select public.mi_rol())
    and conjunto_id is not distinct from (select public.mi_conjunto())
    and unidad_id   is not distinct from (select public.mi_unidad())
    and persona_id  is not distinct from (select public.mi_persona())
  );

drop policy if exists perfiles_edicion_admin on public.perfiles;
create policy perfiles_edicion_admin on public.perfiles
  for update to authenticated
  using (
    conjunto_id = (select public.mi_conjunto())
    and (select public.soy_administracion())
    and rol <> 'admin'
  )
  with check (
    conjunto_id = (select public.mi_conjunto())
    and rol in ('administracion', 'porteria', 'residente')
  );

drop policy if exists perfiles_lectura_propia on public.perfiles;
create policy perfiles_lectura_propia on public.perfiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (conjunto_id = (select public.mi_conjunto()) and (select public.soy_administracion()))
    or ((select public.es_admin_plataforma()) and (select public.soporte_activo(conjunto_id)))
  );

drop policy if exists accesos_soporte_admin on public.accesos_soporte;
create policy accesos_soporte_admin on public.accesos_soporte
  for all to authenticated
  using (admin_id = (select auth.uid()) and (select public.es_admin_plataforma()))
  with check (admin_id = (select auth.uid()) and (select public.es_admin_plataforma()));

-- ---------------------------------------------------------------------
-- 4. Índices para llaves foráneas sin cobertura
-- ---------------------------------------------------------------------
create index if not exists mascotas_conjunto_idx      on public.mascotas (conjunto_id);
create index if not exists perfiles_persona_idx       on public.perfiles (persona_id);
create index if not exists perfiles_unidad_idx        on public.perfiles (unidad_id);
create index if not exists vinculaciones_conjunto_idx on public.vinculaciones (conjunto_id);

commit;

-- Pendiente (no incluido a propósito): unificar las políticas *_lectura y
-- *_escritura duplicadas en torres, unidades, personas, vinculaciones,
-- vehiculos, mascotas y accesos_soporte. Requiere ver sus definiciones y
-- separarlas por comando; conviene hacerlo al construir cada módulo.
