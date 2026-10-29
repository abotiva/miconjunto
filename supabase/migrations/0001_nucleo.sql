-- =============================================================================
-- MiConjunto · Migración 0001 · Núcleo del conjunto
-- -----------------------------------------------------------------------------
-- Crea: conjuntos, torres, unidades, personas, vinculaciones,
--       vehículos, mascotas y perfiles de usuario (ligados a auth.users).
--
-- Cómo ejecutarla:
--   1. Supabase → SQL Editor → New query.
--   2. Pega TODO este archivo y pulsa Run.
--   3. Es idempotente: puedes volver a ejecutarlo sin duplicar nada.
--
-- No borra datos existentes. No incluye todavía visitas, paquetería,
-- reservas, PQRS ni alícuotas: esas van en migraciones posteriores.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Tipos
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.rol_usuario as enum ('administracion', 'porteria', 'residente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tipo_unidad as enum ('apartamento', 'casa', 'local', 'parqueadero', 'deposito');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rol_vinculacion as enum ('propietario', 'residente', 'arrendatario', 'autorizado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.estado_registro as enum ('activo', 'inactivo');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 2. Función común para actualizar la marca de tiempo
-- -----------------------------------------------------------------------------
create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Tablas
-- -----------------------------------------------------------------------------
create table if not exists public.conjuntos (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  nit               text,
  direccion         text,
  ciudad            text,
  departamento      text,
  telefono          text,
  email             text,
  coeficiente_total numeric(14, 6),
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

create table if not exists public.torres (
  id             uuid primary key default gen_random_uuid(),
  conjunto_id    uuid not null references public.conjuntos(id) on delete cascade,
  nombre         text not null,
  pisos          integer,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (conjunto_id, nombre)
);

create table if not exists public.unidades (
  id             uuid primary key default gen_random_uuid(),
  conjunto_id    uuid not null references public.conjuntos(id) on delete cascade,
  torre_id       uuid references public.torres(id) on delete set null,
  identificador  text not null,
  tipo           public.tipo_unidad not null default 'apartamento',
  coeficiente    numeric(10, 6) not null default 0 check (coeficiente >= 0),
  area_m2        numeric(10, 2),
  direccion      text,
  estado         public.estado_registro not null default 'activo',
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.personas (
  id              uuid primary key default gen_random_uuid(),
  conjunto_id     uuid not null references public.conjuntos(id) on delete cascade,
  tipo_documento  text not null default 'CC',
  documento       text not null,
  nombres         text not null,
  apellidos       text not null,
  email           text,
  telefono        text,
  consentimiento  boolean not null default false,
  observaciones   text,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create table if not exists public.vinculaciones (
  id               uuid primary key default gen_random_uuid(),
  conjunto_id      uuid not null references public.conjuntos(id) on delete cascade,
  unidad_id        uuid not null references public.unidades(id) on delete cascade,
  persona_id       uuid not null references public.personas(id) on delete cascade,
  rol              public.rol_vinculacion not null default 'residente',
  es_representante boolean not null default false,
  desde            date,
  hasta            date,
  activo           boolean not null default true,
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now()
);

create table if not exists public.vehiculos (
  id             uuid primary key default gen_random_uuid(),
  conjunto_id    uuid not null references public.conjuntos(id) on delete cascade,
  unidad_id      uuid references public.unidades(id) on delete set null,
  placa          text not null,
  tipo           text not null default 'automovil',
  marca          text,
  color          text,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.mascotas (
  id             uuid primary key default gen_random_uuid(),
  conjunto_id    uuid not null references public.conjuntos(id) on delete cascade,
  unidad_id      uuid references public.unidades(id) on delete set null,
  nombre         text not null,
  especie        text not null default 'perro',
  raza           text,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Perfil: relaciona una cuenta de auth.users con un conjunto, un rol y,
-- opcionalmente, una unidad (el residente solo ve la suya).
create table if not exists public.perfiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  conjunto_id    uuid references public.conjuntos(id) on delete set null,
  persona_id     uuid references public.personas(id) on delete set null,
  unidad_id      uuid references public.unidades(id) on delete set null,
  rol            public.rol_usuario not null default 'residente',
  nombres        text,
  email          text,
  activo         boolean not null default true,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. Índices
-- -----------------------------------------------------------------------------
create unique index if not exists unidades_identificador_uk
  on public.unidades (
    conjunto_id,
    coalesce(torre_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(identificador)
  );

create index if not exists unidades_conjunto_idx on public.unidades (conjunto_id);
create index if not exists unidades_torre_idx on public.unidades (torre_id);

create unique index if not exists personas_documento_uk
  on public.personas (conjunto_id, tipo_documento, documento);
create index if not exists personas_nombre_idx on public.personas (lower(nombres), lower(apellidos));

create index if not exists vinculaciones_unidad_idx on public.vinculaciones (unidad_id) where activo;
create index if not exists vinculaciones_persona_idx on public.vinculaciones (persona_id);
create unique index if not exists vinculaciones_activa_uk
  on public.vinculaciones (unidad_id, persona_id) where activo;

create unique index if not exists vehiculos_placa_uk
  on public.vehiculos (conjunto_id, lower(placa));
create index if not exists vehiculos_unidad_idx on public.vehiculos (unidad_id);

create index if not exists mascotas_unidad_idx on public.mascotas (unidad_id);
create index if not exists perfiles_conjunto_idx on public.perfiles (conjunto_id);

-- -----------------------------------------------------------------------------
-- 5. Disparadores de actualizado_en
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'conjuntos', 'torres', 'unidades', 'personas',
    'vinculaciones', 'vehiculos', 'mascotas', 'perfiles'
  ]
  loop
    execute format('drop trigger if exists trg_%1$s_actualizado on public.%1$s', t);
    execute format(
      'create trigger trg_%1$s_actualizado before update on public.%1$s
       for each row execute function public.tocar_actualizado_en()', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 6. Perfil automático al crear un usuario en auth.users
-- -----------------------------------------------------------------------------
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conjunto uuid;
  v_rol      public.rol_usuario;
begin
  v_conjunto := nullif(new.raw_user_meta_data ->> 'conjunto_id', '')::uuid;
  v_rol := coalesce(
    nullif(new.raw_user_meta_data ->> 'rol', '')::public.rol_usuario,
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

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- -----------------------------------------------------------------------------
-- 7. Funciones auxiliares para las políticas (SECURITY DEFINER para evitar
--    recursión al leer la propia tabla de perfiles)
-- -----------------------------------------------------------------------------
create or replace function public.mi_conjunto()
returns uuid
language sql stable security definer set search_path = public
as $$
  select conjunto_id from public.perfiles where id = auth.uid() and activo limit 1;
$$;

create or replace function public.mi_rol()
returns public.rol_usuario
language sql stable security definer set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid() and activo limit 1;
$$;

create or replace function public.mi_unidad()
returns uuid
language sql stable security definer set search_path = public
as $$
  select unidad_id from public.perfiles where id = auth.uid() and activo limit 1;
$$;

create or replace function public.puedo_administrar()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select rol in ('administracion', 'porteria')
     from public.perfiles
     where id = auth.uid() and activo
     limit 1),
    false
  );
$$;

create or replace function public.soy_administracion()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select rol = 'administracion'
     from public.perfiles
     where id = auth.uid() and activo
     limit 1),
    false
  );
$$;

-- -----------------------------------------------------------------------------
-- 8. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.conjuntos     enable row level security;
alter table public.torres        enable row level security;
alter table public.unidades      enable row level security;
alter table public.personas      enable row level security;
alter table public.vinculaciones enable row level security;
alter table public.vehiculos     enable row level security;
alter table public.mascotas      enable row level security;
alter table public.perfiles      enable row level security;

-- --- conjuntos ---------------------------------------------------------------
drop policy if exists conjuntos_lectura on public.conjuntos;
create policy conjuntos_lectura on public.conjuntos
  for select to authenticated
  using (id = public.mi_conjunto());

drop policy if exists conjuntos_edicion on public.conjuntos;
create policy conjuntos_edicion on public.conjuntos
  for update to authenticated
  using (id = public.mi_conjunto() and public.soy_administracion())
  with check (id = public.mi_conjunto());

-- --- torres ------------------------------------------------------------------
drop policy if exists torres_lectura on public.torres;
create policy torres_lectura on public.torres
  for select to authenticated
  using (conjunto_id = public.mi_conjunto());

drop policy if exists torres_escritura on public.torres;
create policy torres_escritura on public.torres
  for all to authenticated
  using (conjunto_id = public.mi_conjunto() and public.soy_administracion())
  with check (conjunto_id = public.mi_conjunto() and public.soy_administracion());

-- --- unidades ----------------------------------------------------------------
drop policy if exists unidades_lectura on public.unidades;
create policy unidades_lectura on public.unidades
  for select to authenticated
  using (
    conjunto_id = public.mi_conjunto()
    and (public.puedo_administrar() or id = public.mi_unidad())
  );

drop policy if exists unidades_escritura on public.unidades;
create policy unidades_escritura on public.unidades
  for all to authenticated
  using (conjunto_id = public.mi_conjunto() and public.soy_administracion())
  with check (conjunto_id = public.mi_conjunto() and public.soy_administracion());

-- --- personas ----------------------------------------------------------------
drop policy if exists personas_lectura on public.personas;
create policy personas_lectura on public.personas
  for select to authenticated
  using (
    conjunto_id = public.mi_conjunto()
    and (
      public.puedo_administrar()
      or exists (
        select 1
        from public.vinculaciones v
        where v.persona_id = personas.id
          and v.unidad_id = public.mi_unidad()
          and v.activo
      )
    )
  );

drop policy if exists personas_escritura on public.personas;
create policy personas_escritura on public.personas
  for all to authenticated
  using (conjunto_id = public.mi_conjunto() and public.puedo_administrar())
  with check (conjunto_id = public.mi_conjunto() and public.puedo_administrar());

-- --- vinculaciones -----------------------------------------------------------
drop policy if exists vinculaciones_lectura on public.vinculaciones;
create policy vinculaciones_lectura on public.vinculaciones
  for select to authenticated
  using (
    conjunto_id = public.mi_conjunto()
    and (public.puedo_administrar() or unidad_id = public.mi_unidad())
  );

drop policy if exists vinculaciones_escritura on public.vinculaciones;
create policy vinculaciones_escritura on public.vinculaciones
  for all to authenticated
  using (conjunto_id = public.mi_conjunto() and public.puedo_administrar())
  with check (conjunto_id = public.mi_conjunto() and public.puedo_administrar());

-- --- vehiculos ---------------------------------------------------------------
drop policy if exists vehiculos_lectura on public.vehiculos;
create policy vehiculos_lectura on public.vehiculos
  for select to authenticated
  using (
    conjunto_id = public.mi_conjunto()
    and (public.puedo_administrar() or unidad_id = public.mi_unidad())
  );

drop policy if exists vehiculos_escritura on public.vehiculos;
create policy vehiculos_escritura on public.vehiculos
  for all to authenticated
  using (conjunto_id = public.mi_conjunto() and public.puedo_administrar())
  with check (conjunto_id = public.mi_conjunto() and public.puedo_administrar());

-- --- mascotas ----------------------------------------------------------------
drop policy if exists mascotas_lectura on public.mascotas;
create policy mascotas_lectura on public.mascotas
  for select to authenticated
  using (
    conjunto_id = public.mi_conjunto()
    and (public.puedo_administrar() or unidad_id = public.mi_unidad())
  );

drop policy if exists mascotas_escritura on public.mascotas;
create policy mascotas_escritura on public.mascotas
  for all to authenticated
  using (conjunto_id = public.mi_conjunto() and public.puedo_administrar())
  with check (conjunto_id = public.mi_conjunto() and public.puedo_administrar());

-- --- perfiles ----------------------------------------------------------------
drop policy if exists perfiles_lectura_propia on public.perfiles;
create policy perfiles_lectura_propia on public.perfiles
  for select to authenticated
  using (
    id = auth.uid()
    or (conjunto_id = public.mi_conjunto() and public.soy_administracion())
  );

drop policy if exists perfiles_edicion_admin on public.perfiles;
create policy perfiles_edicion_admin on public.perfiles
  for update to authenticated
  using (conjunto_id = public.mi_conjunto() and public.soy_administracion())
  with check (conjunto_id = public.mi_conjunto());

-- El usuario puede editar su propio nombre, pero no su rol ni su conjunto.
drop policy if exists perfiles_edicion_propia on public.perfiles;
create policy perfiles_edicion_propia on public.perfiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and rol = public.mi_rol() and conjunto_id = public.mi_conjunto());

-- -----------------------------------------------------------------------------
-- 9. Permisos para los roles de Supabase
--    (RLS decide qué filas; esto decide qué operaciones existen)
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete
  on public.conjuntos, public.torres, public.unidades, public.personas,
     public.vinculaciones, public.vehiculos, public.mascotas, public.perfiles
  to authenticated;

commit;

-- =============================================================================
-- Después de ejecutar:
--   - El mensaje "Success. No rows returned" es lo esperado.
--   - Recarga la página de la app: el diagnóstico debe pasar a
--     "API de datos · tabla lista".
-- =============================================================================
