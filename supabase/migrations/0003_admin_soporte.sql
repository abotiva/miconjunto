-- =============================================================================
-- MiConjunto · Migración 0003 · Rol Admin y acceso de soporte
-- -----------------------------------------------------------------------------
-- Qué hace:
--   1. Agrega el valor 'admin' al tipo de rol (plataforma, no del conjunto).
--   2. Crea la tabla de accesos temporales de soporte.
--   3. Añade las funciones que usan las políticas.
--   4. Amplía las políticas para que el Admin lea solo con acceso activo.
--
-- IMPORTANTE: este archivo NO va dentro de begin/commit.
-- El SQL Editor de Supabase ejecuta cada sentencia por separado, y así el
-- valor nuevo del enum puede usarse más abajo en el mismo script.
-- Si tu editor envuelve todo en una transacción, ejecuta primero la línea
-- del ALTER TYPE sola y luego el resto.
-- =============================================================================

alter type public.rol_usuario add value if not exists 'admin';

-- -----------------------------------------------------------------------------
-- 1. Accesos de soporte
-- -----------------------------------------------------------------------------
create table if not exists public.accesos_soporte (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references public.perfiles(id) on delete cascade,
  conjunto_id uuid not null references public.conjuntos(id) on delete cascade,
  motivo      text not null check (length(trim(motivo)) >= 10),
  desde       timestamptz not null default now(),
  hasta       timestamptz not null default (now() + interval '4 hours'),
  revocado_en timestamptz,
  creado_en   timestamptz not null default now(),
  check (hasta > desde),
  check (hasta <= desde + interval '24 hours')
);

create index if not exists accesos_soporte_admin_idx
  on public.accesos_soporte (admin_id, conjunto_id) where revocado_en is null;
create index if not exists accesos_soporte_conjunto_idx
  on public.accesos_soporte (conjunto_id);

-- -----------------------------------------------------------------------------
-- 2. Funciones de apoyo
-- -----------------------------------------------------------------------------
create or replace function public.es_admin_plataforma()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select rol = 'admin' from public.perfiles where id = auth.uid() and activo limit 1),
    false
  );
$$;

-- ¿El Admin actual tiene un acceso de soporte vigente para este conjunto?
create or replace function public.soporte_activo(p_conjunto uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.accesos_soporte a
    where a.admin_id = auth.uid()
      and a.conjunto_id = p_conjunto
      and a.revocado_en is null
      and now() >= a.desde
      and now() < a.hasta
  );
$$;

-- -----------------------------------------------------------------------------
-- 3. RLS de la tabla nueva
-- -----------------------------------------------------------------------------
alter table public.accesos_soporte enable row level security;

drop policy if exists accesos_soporte_admin on public.accesos_soporte;
create policy accesos_soporte_admin on public.accesos_soporte
  for all to authenticated
  using (admin_id = auth.uid() and public.es_admin_plataforma())
  with check (admin_id = auth.uid() and public.es_admin_plataforma());

drop policy if exists accesos_soporte_conjunto_lectura on public.accesos_soporte;
create policy accesos_soporte_conjunto_lectura on public.accesos_soporte
  for select to authenticated
  using (conjunto_id = public.mi_conjunto() and public.soy_administracion());

grant select, insert, update on public.accesos_soporte to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Políticas de lectura ampliadas
--    Regla: el Admin solo entra si tiene un acceso de soporte vigente.
-- -----------------------------------------------------------------------------
drop policy if exists conjuntos_lectura on public.conjuntos;
create policy conjuntos_lectura on public.conjuntos
  for select to authenticated
  using (id = public.mi_conjunto() or public.es_admin_plataforma());

drop policy if exists conjuntos_creacion on public.conjuntos;
create policy conjuntos_creacion on public.conjuntos
  for insert to authenticated
  with check (public.es_admin_plataforma());

drop policy if exists torres_lectura on public.torres;
create policy torres_lectura on public.torres
  for select to authenticated
  using (
    conjunto_id = public.mi_conjunto()
    or (public.es_admin_plataforma() and public.soporte_activo(conjunto_id))
  );

drop policy if exists unidades_lectura on public.unidades;
create policy unidades_lectura on public.unidades
  for select to authenticated
  using (
    (conjunto_id = public.mi_conjunto()
      and (public.puedo_administrar() or id = public.mi_unidad()))
    or (public.es_admin_plataforma() and public.soporte_activo(conjunto_id))
  );

drop policy if exists personas_lectura on public.personas;
create policy personas_lectura on public.personas
  for select to authenticated
  using (
    (conjunto_id = public.mi_conjunto()
      and (
        public.puedo_administrar()
        or exists (
          select 1 from public.vinculaciones v
          where v.persona_id = personas.id
            and v.unidad_id = public.mi_unidad()
            and v.activo
        )
      ))
    or (public.es_admin_plataforma() and public.soporte_activo(conjunto_id))
  );

drop policy if exists vinculaciones_lectura on public.vinculaciones;
create policy vinculaciones_lectura on public.vinculaciones
  for select to authenticated
  using (
    (conjunto_id = public.mi_conjunto()
      and (public.puedo_administrar() or unidad_id = public.mi_unidad()))
    or (public.es_admin_plataforma() and public.soporte_activo(conjunto_id))
  );

drop policy if exists vehiculos_lectura on public.vehiculos;
create policy vehiculos_lectura on public.vehiculos
  for select to authenticated
  using (
    (conjunto_id = public.mi_conjunto()
      and (public.puedo_administrar() or unidad_id = public.mi_unidad()))
    or (public.es_admin_plataforma() and public.soporte_activo(conjunto_id))
  );

drop policy if exists mascotas_lectura on public.mascotas;
create policy mascotas_lectura on public.mascotas
  for select to authenticated
  using (
    (conjunto_id = public.mi_conjunto()
      and (public.puedo_administrar() or unidad_id = public.mi_unidad()))
    or (public.es_admin_plataforma() and public.soporte_activo(conjunto_id))
  );

drop policy if exists perfiles_lectura_propia on public.perfiles;
create policy perfiles_lectura_propia on public.perfiles
  for select to authenticated
  using (
    id = auth.uid()
    or (conjunto_id = public.mi_conjunto() and public.soy_administracion())
    or (public.es_admin_plataforma() and public.soporte_activo(conjunto_id))
  );

-- =============================================================================
-- Después de ejecutar:
--   1. Convierte tu cuenta en Admin (ajusta el correo):
--
--      update public.perfiles
--         set rol = 'admin', conjunto_id = null, unidad_id = null
--       where lower(email) = lower('tu@correo.com');
--
--   2. Crea una segunda cuenta para la Administración del conjunto y asígnale
--      su conjunto. Una misma cuenta no debería ser Admin y Administración:
--      el Admin no ve datos sin acceso de soporte.
-- =============================================================================
