-- =============================================================================
-- MiConjunto · Migración 0004 · Auditoría visible para la Administración
-- -----------------------------------------------------------------------------
-- Permite que la Administración de un conjunto vea quién abrió un acceso de
-- soporte sobre su conjunto (nombre y correo), sin abrir el resto de perfiles.
--
-- Es una política puntual: solo aplica al perfil del Admin que tiene un
-- acceso registrado sobre ese conjunto.
-- =============================================================================

drop policy if exists perfiles_lectura_soporte on public.perfiles;
create policy perfiles_lectura_soporte on public.perfiles
  for select to authenticated
  using (
    public.soy_administracion()
    and exists (
      select 1
      from public.accesos_soporte a
      where a.admin_id = perfiles.id
        and a.conjunto_id = public.mi_conjunto()
    )
  );
