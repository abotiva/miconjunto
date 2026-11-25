-- 0007_integridad_unidades.sql (PENDIENTE de aplicar; revisar antes contra 0005_porteria.sql)
-- Cierra los huecos detectados al revisar el módulo de unidades y residentes:
--   1. Integridad entre conjuntos (unidad, persona, torre y conjunto coinciden).
--   2. Un solo representante activo por unidad y fechas coherentes.
--   3. Escritura solo para administración; portería queda con lectura.
--      Las unidades no se pueden borrar por la API (se desactivan).
--      De paso, las políticas "ALL" se separan por comando, lo que elimina
--      los avisos de "multiple permissive policies" en estas tablas.

begin;

-- ---------------------------------------------------------------------
-- 1. Integridad entre conjuntos
-- ---------------------------------------------------------------------
create or replace function public.validar_vinculacion_conjunto()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.unidades u
    where u.id = new.unidad_id and u.conjunto_id = new.conjunto_id
  ) then
    raise exception 'La unidad no pertenece a este conjunto' using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.personas p
    where p.id = new.persona_id and p.conjunto_id = new.conjunto_id
  ) then
    raise exception 'La persona no pertenece a este conjunto' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.validar_unidad_del_conjunto()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.unidad_id is not null and not exists (
    select 1 from public.unidades u
    where u.id = new.unidad_id and u.conjunto_id = new.conjunto_id
  ) then
    raise exception 'La unidad no pertenece a este conjunto' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.validar_torre_del_conjunto()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.torre_id is not null and not exists (
    select 1 from public.torres t
    where t.id = new.torre_id and t.conjunto_id = new.conjunto_id
  ) then
    raise exception 'La torre no pertenece a este conjunto' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists vinculaciones_validar_conjunto on public.vinculaciones;
create trigger vinculaciones_validar_conjunto
  before insert or update of conjunto_id, unidad_id, persona_id on public.vinculaciones
  for each row execute function public.validar_vinculacion_conjunto();

drop trigger if exists vehiculos_validar_conjunto on public.vehiculos;
create trigger vehiculos_validar_conjunto
  before insert or update of conjunto_id, unidad_id on public.vehiculos
  for each row execute function public.validar_unidad_del_conjunto();

drop trigger if exists mascotas_validar_conjunto on public.mascotas;
create trigger mascotas_validar_conjunto
  before insert or update of conjunto_id, unidad_id on public.mascotas
  for each row execute function public.validar_unidad_del_conjunto();

drop trigger if exists unidades_validar_torre on public.unidades;
create trigger unidades_validar_torre
  before insert or update of conjunto_id, torre_id on public.unidades
  for each row execute function public.validar_torre_del_conjunto();

-- ---------------------------------------------------------------------
-- 2. Representante único por unidad y fechas coherentes
-- ---------------------------------------------------------------------
create unique index if not exists vinculaciones_representante_uk
  on public.vinculaciones (unidad_id)
  where activo and es_representante;

alter table public.vinculaciones
  drop constraint if exists vinculaciones_fechas_ck;
alter table public.vinculaciones
  add constraint vinculaciones_fechas_ck
  check (hasta is null or desde is null or hasta >= desde);

-- ---------------------------------------------------------------------
-- 3. Escritura solo para administración, separada por comando
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'torres', 'unidades', 'personas', 'vinculaciones', 'vehiculos', 'mascotas'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_escritura', t);
    execute format('drop policy if exists %I on public.%I', t || '_insercion', t);
    execute format('drop policy if exists %I on public.%I', t || '_edicion', t);
    execute format('drop policy if exists %I on public.%I', t || '_borrado', t);

    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check (conjunto_id = (select public.mi_conjunto())
                     and (select public.soy_administracion()))',
      t || '_insercion', t);

    execute format(
      'create policy %I on public.%I for update to authenticated
         using (conjunto_id = (select public.mi_conjunto())
                and (select public.soy_administracion()))
         with check (conjunto_id = (select public.mi_conjunto())
                     and (select public.soy_administracion()))',
      t || '_edicion', t);

    -- Las unidades nunca se borran por la API: se desactivan. Borrar una
    -- unidad arrastraría el historial de paquetería (0005) y de visitas.
    if t <> 'unidades' then
      execute format(
        'create policy %I on public.%I for delete to authenticated
           using (conjunto_id = (select public.mi_conjunto())
                  and (select public.soy_administracion()))',
        t || '_borrado', t);
    end if;
  end loop;
end;
$$;

commit;
