-- =============================================================================
-- MiConjunto · Migración 0005 · Portería
-- -----------------------------------------------------------------------------
-- Crea lo que la bitácora del turno necesita para dejar de ser un diseño:
--
--   visitas    · quién entra, con qué autorización y a qué hora sale
--   paquetes   · recepción, tiempo de espera y entrega
--   novedades  · reportes del turno con responsable y cierre
--
-- Además:
--   · `movimientos_turno` — vista unificada que alimenta la bitácora
--   · `autorizar_visita()` y `cancelar_visita()` — las dos acciones que hace
--     el residente sin ver el resto de la operación
--   · RLS por rol, con las mismas funciones de la migración 0001/0003
--
-- Cómo ejecutarla:
--   1. Supabase → SQL Editor → New query.
--   2. Pega TODO este archivo y pulsa Run.
--   3. Es idempotente: puedes volver a ejecutarlo sin duplicar nada.
--
-- No borra datos. No toca las tablas existentes: solo agrega.
-- Requiere PostgreSQL 15 o superior (vistas con `security_invoker`); Supabase
-- ya lo cumple.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Tipos
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.tipo_visita as enum ('peatonal', 'vehicular');
exception when duplicate_object then null; end $$;

-- esperada → dentro → salio. Cancelada es la visita autorizada que no llegó.
do $$ begin
  create type public.estado_visita as enum ('esperada', 'dentro', 'salio', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.estado_paquete as enum ('recibido', 'entregado', 'devuelto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.categoria_novedad as enum (
    'seguridad', 'aseo', 'mantenimiento', 'convivencia', 'otro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.estado_novedad as enum ('abierta', 'en_revision', 'cerrada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.prioridad_novedad as enum ('baja', 'media', 'alta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.turno_porteria as enum ('manana', 'tarde', 'noche');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 2. Utilidades del turno
-- -----------------------------------------------------------------------------

-- Turno vigente en hora de Bogotá. Misma franja que `reloj-turno.tsx`:
-- 06:00–14:00 mañana · 14:00–22:00 tarde · 22:00–06:00 noche.
create or replace function public.turno_actual()
returns public.turno_porteria
language sql stable
set search_path = public
as $$
  with h as (
    select extract(hour from (now() at time zone 'America/Bogota'))::int as hora
  )
  select case
    when h.hora >= 6 and h.hora < 14 then 'manana'
    when h.hora >= 14 and h.hora < 22 then 'tarde'
    else 'noche'
  end::public.turno_porteria
  from h;
$$;

-- -----------------------------------------------------------------------------
-- 3. Visitas
-- -----------------------------------------------------------------------------
create table if not exists public.visitas (
  id              uuid primary key default gen_random_uuid(),
  conjunto_id     uuid not null references public.conjuntos(id) on delete cascade,
  -- Puede quedar vacía si la visita es a administración o a un área común.
  unidad_id       uuid references public.unidades(id) on delete set null,
  nombre_visitante text not null,
  documento       text,
  telefono        text,
  tipo            public.tipo_visita not null default 'peatonal',
  placa           text,
  personas        integer not null default 1,
  motivo          text,
  estado          public.estado_visita not null default 'esperada',
  entrada_en      timestamptz,
  salida_en       timestamptz,
  autorizada_por  uuid references public.perfiles(id) on delete set null,
  registrada_por  uuid references public.perfiles(id) on delete set null,
  observaciones   text,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  constraint visitas_nombre_valido
    check (length(btrim(nombre_visitante)) >= 2),
  constraint visitas_personas_validas
    check (personas between 1 and 50),
  constraint visitas_placa_requerida
    check (tipo = 'peatonal' or length(btrim(coalesce(placa, ''))) >= 5),
  constraint visitas_salida_con_entrada
    check (estado <> 'salio' or (entrada_en is not null and salida_en is not null))
);

create index if not exists visitas_conjunto_estado_idx
  on public.visitas (conjunto_id, estado, creado_en desc);
create index if not exists visitas_unidad_idx
  on public.visitas (unidad_id);
create index if not exists visitas_placa_idx
  on public.visitas (conjunto_id, upper(placa)) where placa is not null;

-- Sella las horas y la autoría. No confía en lo que envíe el cliente:
--   · una visita pasa a «dentro» y se le pone la hora de entrada;
--   · al pasar a «salio» se completa la entrada si faltaba y se sella la salida;
--   · quien no puede administrar (residente) solo crea visitas «esperada»
--     autorizadas por él mismo, aunque mande otro estado.
create or replace function public.preparar_visita()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.estado = 'dentro' then
    new.entrada_en := coalesce(new.entrada_en, now());
    new.salida_en := null;
  elsif new.estado = 'salio' then
    new.entrada_en := coalesce(new.entrada_en, now());
    new.salida_en := coalesce(new.salida_en, now());
  end if;

  if tg_op = 'INSERT' then
    if public.puedo_administrar() then
      new.registrada_por := coalesce(new.registrada_por, auth.uid());
    else
      new.autorizada_por := auth.uid();
      new.estado := 'esperada';
      new.entrada_en := null;
      new.salida_en := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_visitas_preparar on public.visitas;
create trigger trg_visitas_preparar
  before insert or update on public.visitas
  for each row execute function public.preparar_visita();

-- -----------------------------------------------------------------------------
-- 4. Paquetería
-- -----------------------------------------------------------------------------
create table if not exists public.paquetes (
  id              uuid primary key default gen_random_uuid(),
  conjunto_id     uuid not null references public.conjuntos(id) on delete cascade,
  -- restrict: el historial de paquetería no debe borrarse arrastrado por una unidad.
  unidad_id       uuid not null references public.unidades(id) on delete restrict,
  transportadora  text,
  guia            text,
  descripcion     text,
  cantidad        integer not null default 1,
  estado          public.estado_paquete not null default 'recibido',
  recibido_por    uuid references public.perfiles(id) on delete set null,
  recibido_en     timestamptz not null default now(),
  entregado_a     text,
  entregado_por   uuid references public.perfiles(id) on delete set null,
  entregado_en    timestamptz,
  observaciones   text,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  constraint paquetes_cantidad_valida
    check (cantidad between 1 and 200),
  constraint paquetes_entrega_con_fecha
    check (estado <> 'entregado' or (entregado_en is not null and entregado_a is not null))
);

create index if not exists paquetes_pendientes_idx
  on public.paquetes (conjunto_id, recibido_en) where estado = 'recibido';
create index if not exists paquetes_unidad_idx
  on public.paquetes (unidad_id, creado_en desc);

-- El tiempo de espera es el dato que reclama el residente: la hora de
-- recepción nunca se toca y la de entrega se sella al marcar «entregado».
create or replace function public.sellar_paquete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.recibido_por := coalesce(new.recibido_por, auth.uid());
    new.recibido_en := coalesce(new.recibido_en, now());
  end if;

  if new.estado = 'entregado' and new.entregado_en is null then
    new.entregado_en := now();
    new.entregado_por := coalesce(new.entregado_por, auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_paquetes_sellar on public.paquetes;
create trigger trg_paquetes_sellar
  before insert or update on public.paquetes
  for each row execute function public.sellar_paquete();

-- -----------------------------------------------------------------------------
-- 5. Novedades
-- -----------------------------------------------------------------------------
create table if not exists public.novedades (
  id             uuid primary key default gen_random_uuid(),
  conjunto_id    uuid not null references public.conjuntos(id) on delete cascade,
  unidad_id      uuid references public.unidades(id) on delete set null,
  turno          public.turno_porteria not null default public.turno_actual(),
  categoria      public.categoria_novedad not null default 'otro',
  prioridad      public.prioridad_novedad not null default 'media',
  descripcion    text not null,
  ubicacion      text,
  estado         public.estado_novedad not null default 'abierta',
  reportada_por  uuid references public.perfiles(id) on delete set null,
  atendida_por   uuid references public.perfiles(id) on delete set null,
  cerrada_en     timestamptz,
  cierre_nota    text,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint novedades_descripcion_valida
    check (length(btrim(descripcion)) >= 5)
);

create index if not exists novedades_abiertas_idx
  on public.novedades (conjunto_id, prioridad, creado_en desc)
  where estado <> 'cerrada';
create index if not exists novedades_unidad_idx
  on public.novedades (unidad_id);

-- Cerrar sin nota es cerrar a ciegas: se exige qué se hizo.
create or replace function public.sellar_novedad()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.reportada_por := coalesce(new.reportada_por, auth.uid());
  end if;

  if new.estado = 'cerrada' then
    new.cerrada_en := coalesce(new.cerrada_en, now());
    new.atendida_por := coalesce(new.atendida_por, auth.uid());
  else
    new.cerrada_en := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_novedades_sellar on public.novedades;
create trigger trg_novedades_sellar
  before insert or update on public.novedades
  for each row execute function public.sellar_novedad();

-- -----------------------------------------------------------------------------
-- 6. Disparadores de actualizado_en (mismo patrón que 0001)
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['visitas', 'paquetes', 'novedades']
  loop
    execute format('drop trigger if exists trg_%1$s_actualizado on public.%1$s', t);
    execute format(
      'create trigger trg_%1$s_actualizado before update on public.%1$s
       for each row execute function public.tocar_actualizado_en()', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 7. Row Level Security
--    Regla general: portería y administración operan el conjunto completo;
--    el residente ve lo suyo y puede autorizar visitas, nada más.
--    El Admin de plataforma solo entra con un acceso de soporte vigente.
-- -----------------------------------------------------------------------------
alter table public.visitas   enable row level security;
alter table public.paquetes  enable row level security;
alter table public.novedades enable row level security;

-- --- visitas ----------------------------------------------------------------
drop policy if exists visitas_lectura on public.visitas;
create policy visitas_lectura on public.visitas
  for select to authenticated
  using (
    (conjunto_id = public.mi_conjunto()
      and (public.puedo_administrar() or unidad_id = public.mi_unidad()))
    or (public.es_admin_plataforma() and public.soporte_activo(conjunto_id))
  );

-- Portería registra en la puerta; el residente solo pre-autoriza para su unidad,
-- en estado «esperada» y firmando él mismo la autorización.
drop policy if exists visitas_registro on public.visitas;
create policy visitas_registro on public.visitas
  for insert to authenticated
  with check (
    conjunto_id = public.mi_conjunto()
    and (
      public.puedo_administrar()
      or (
        unidad_id = public.mi_unidad()
        and estado = 'esperada'
        and autorizada_por = auth.uid()
      )
    )
  );

drop policy if exists visitas_actualizacion on public.visitas;
create policy visitas_actualizacion on public.visitas
  for update to authenticated
  using (conjunto_id = public.mi_conjunto() and public.puedo_administrar())
  with check (conjunto_id = public.mi_conjunto() and public.puedo_administrar());

-- --- paquetes ---------------------------------------------------------------
drop policy if exists paquetes_lectura on public.paquetes;
create policy paquetes_lectura on public.paquetes
  for select to authenticated
  using (
    (conjunto_id = public.mi_conjunto()
      and (public.puedo_administrar() or unidad_id = public.mi_unidad()))
    or (public.es_admin_plataforma() and public.soporte_activo(conjunto_id))
  );

-- Solo portería y administración reciben y entregan. El residente los ve, no
-- los firma: la firma es del funcionario que entrega en la portería.
drop policy if exists paquetes_recepcion on public.paquetes;
create policy paquetes_recepcion on public.paquetes
  for insert to authenticated
  with check (conjunto_id = public.mi_conjunto() and public.puedo_administrar());

drop policy if exists paquetes_entrega on public.paquetes;
create policy paquetes_entrega on public.paquetes
  for update to authenticated
  using (conjunto_id = public.mi_conjunto() and public.puedo_administrar())
  with check (conjunto_id = public.mi_conjunto() and public.puedo_administrar());

-- --- novedades --------------------------------------------------------------
-- El residente no ve la bitácora interna: sus reportes entran por PQRS.
drop policy if exists novedades_lectura on public.novedades;
create policy novedades_lectura on public.novedades
  for select to authenticated
  using (
    (conjunto_id = public.mi_conjunto() and public.puedo_administrar())
    or (public.es_admin_plataforma() and public.soporte_activo(conjunto_id))
  );

drop policy if exists novedades_registro on public.novedades;
create policy novedades_registro on public.novedades
  for insert to authenticated
  with check (conjunto_id = public.mi_conjunto() and public.puedo_administrar());

drop policy if exists novedades_atencion on public.novedades;
create policy novedades_atencion on public.novedades
  for update to authenticated
  using (conjunto_id = public.mi_conjunto() and public.puedo_administrar())
  with check (conjunto_id = public.mi_conjunto() and public.puedo_administrar());

-- -----------------------------------------------------------------------------
-- 8. Acciones del residente
--    Van como funciones `security definer` porque el residente no puede
--    actualizar la tabla: así autoriza y cancela sin poder tocar el resto.
-- -----------------------------------------------------------------------------
create or replace function public.autorizar_visita(
  p_nombre      text,
  p_documento   text default null,
  p_tipo        public.tipo_visita default 'peatonal',
  p_placa       text default null,
  p_personas    integer default 1,
  p_motivo      text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conjunto uuid := public.mi_conjunto();
  v_unidad   uuid := public.mi_unidad();
  v_id       uuid;
begin
  if v_conjunto is null or v_unidad is null then
    raise exception 'Tu usuario no tiene una unidad asignada.'
      using errcode = '42501';
  end if;

  if p_tipo = 'vehicular' and length(btrim(coalesce(p_placa, ''))) < 5 then
    raise exception 'Una visita vehicular necesita la placa.'
      using errcode = '22023';
  end if;

  if coalesce(p_personas, 1) < 1 or coalesce(p_personas, 1) > 50 then
    raise exception 'El número de personas debe estar entre 1 y 50.'
      using errcode = '22023';
  end if;

  insert into public.visitas (
    conjunto_id, unidad_id, nombre_visitante, documento,
    tipo, placa, personas, motivo, estado, autorizada_por
  )
  values (
    v_conjunto, v_unidad, btrim(p_nombre), nullif(btrim(coalesce(p_documento, '')), ''),
    p_tipo, upper(nullif(btrim(coalesce(p_placa, '')), '')),
    greatest(coalesce(p_personas, 1), 1), nullif(btrim(coalesce(p_motivo, '')), ''),
    'esperada', auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.cancelar_visita(p_visita uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visita public.visitas;
begin
  select * into v_visita from public.visitas where id = p_visita;

  if not found
     or v_visita.conjunto_id is distinct from public.mi_conjunto()
     or not (public.puedo_administrar() or v_visita.autorizada_por = auth.uid())
  then
    raise exception 'Visita no encontrada o sin permiso para cancelarla.'
      using errcode = '42501';
  end if;

  if v_visita.estado <> 'esperada' then
    raise exception 'Solo se puede cancelar una visita que aún no ha entrado.'
      using errcode = '22023';
  end if;

  update public.visitas set estado = 'cancelada' where id = p_visita;
end;
$$;

grant execute on function public.autorizar_visita(text, text, public.tipo_visita, text, integer, text)
  to authenticated;
grant execute on function public.cancelar_visita(uuid) to authenticated;

-- PostgreSQL concede EXECUTE a PUBLIC por defecto: se retira para que solo
-- una sesión con perfil pueda invocarlas.
revoke all on function public.autorizar_visita(text, text, public.tipo_visita, text, integer, text)
  from public, anon;
revoke all on function public.cancelar_visita(uuid) from public, anon;

-- -----------------------------------------------------------------------------
-- 9. Bitácora unificada
--    Una vista, no una cuarta tabla: la fuente de verdad siguen siendo las tres
--    tablas. `security_invoker` hace que el RLS de cada tabla se aplique a quien
--    consulta, también desde la vista.
-- -----------------------------------------------------------------------------
create or replace view public.movimientos_turno
with (security_invoker = true) as
select
  v.id,
  v.conjunto_id,
  'visita'::text                    as clase,
  v.estado::text                    as estado,
  v.nombre_visitante                as referencia,
  concat_ws(' · ',
    nullif(v.motivo, ''),
    nullif(v.placa, ''),
    v.personas::text || case when v.personas = 1 then ' persona' else ' personas' end
  )                                 as detalle,
  v.unidad_id,
  coalesce(v.salida_en, v.entrada_en, v.creado_en) as ocurrido_en,
  coalesce(v.registrada_por, v.autorizada_por)     as responsable_id
from public.visitas v

union all

select
  p.id,
  p.conjunto_id,
  'paquete'::text                   as clase,
  p.estado::text                    as estado,
  coalesce(nullif(p.transportadora, ''), 'Paquete') as referencia,
  concat_ws(' · ',
    nullif(p.descripcion, ''),
    case when p.entregado_a is not null then 'Entregado a ' || p.entregado_a end
  )                                 as detalle,
  p.unidad_id,
  coalesce(p.entregado_en, p.recibido_en) as ocurrido_en,
  coalesce(p.entregado_por, p.recibido_por) as responsable_id
from public.paquetes p

union all

select
  n.id,
  n.conjunto_id,
  'novedad'::text                   as clase,
  n.estado::text                    as estado,
  n.categoria::text                 as referencia,
  concat_ws(' · ', nullif(n.ubicacion, ''), nullif(n.descripcion, '')) as detalle,
  n.unidad_id,
  coalesce(n.cerrada_en, n.creado_en) as ocurrido_en,
  coalesce(n.atendida_por, n.reportada_por) as responsable_id
from public.novedades n;

-- -----------------------------------------------------------------------------
-- 10. Permisos para los roles de Supabase
--     Sin `delete` a propósito: en portería nada se borra, se cancela, se
--     entrega o se cierra. El registro queda para la auditoría.
-- -----------------------------------------------------------------------------
grant select, insert, update
  on public.visitas, public.paquetes, public.novedades
  to authenticated;

grant select on public.movimientos_turno to authenticated;

-- Supabase concede permisos a `anon` por defecto en objetos nuevos. El RLS ya
-- les niega las filas, pero se retiran para no depender solo de eso.
revoke all on public.visitas, public.paquetes, public.novedades, public.movimientos_turno
  from anon;

commit;

-- =============================================================================
-- Después de ejecutar:
--   - El mensaje "Success. No rows returned" es lo esperado.
--   - Revisa que las tres tablas queden con RLS:
--
--       select relname, relrowsecurity
--         from pg_class
--        where relname in ('visitas', 'paquetes', 'novedades');
--
--   - Prueba rápida del turno (con una cuenta de portería):
--
--       select clase, estado, referencia, ocurrido_en
--         from public.movimientos_turno
--        order by ocurrido_en desc
--        limit 20;
--
--   - Y del residente: `select public.autorizar_visita('Ana Gómez', 'CC 1020',
--     'peatonal', null, 1, 'Visita familiar');` debe devolver un id y la visita
--     debe aparecer en `visitas` como «esperada».
-- =============================================================================
