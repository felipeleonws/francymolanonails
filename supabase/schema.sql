-- ============================================================
-- FRANCY MOLANO NAILS STUDIO · esquema v1 (equipo + citas)
-- Cómo aplicarlo: Supabase Dashboard → SQL Editor → New query
-- pega TODO este archivo → Run.
-- ⚠️ ANTES: reemplaza 'ADMIN@EJEMPLO.COM' por tu correo (el que
-- usarás para entrar como administradora). Debe ser el MISMO correo
-- del usuario que crearás en Authentication → Users.
-- ============================================================

create table if not exists profesionales (
  id text primary key,
  nombre text not null,
  email text unique,
  color text not null default '#8BA99A',
  foto text,
  activo boolean not null default true,
  es_admin boolean not null default false,
  horarios jsonb not null default '[]',
  servicios_ids text[] not null default '{}',
  capacidad_diaria integer not null default 8,
  created_at timestamptz not null default now()
);

create table if not exists citas (
  id text primary key,
  profesional_id text not null references profesionales(id) on delete restrict,
  servicio_id text not null default 'manual',
  variante_id text not null default '',
  variante_nombre text not null default '',
  cliente_nombre text not null,
  cliente_telefono text not null default '',
  cliente_email text,
  notas text,
  fecha date not null,
  inicio integer not null,
  duracion integer not null,
  precio integer not null default 0,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio')),
  creada_en timestamptz not null default now(),
  es_walkin boolean not null default false
);

create index if not exists citas_prof_fecha_idx on citas (profesional_id, fecha);

alter table profesionales enable row level security;
alter table citas enable row level security;

-- ¿La persona logueada es admin activa?
create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profesionales
    where email = (auth.jwt() ->> 'email')
      and es_admin
      and activo
  );
$$;

drop policy if exists "equipo lee profesionales" on profesionales;
create policy "equipo lee profesionales"
  on profesionales for select to authenticated using (true);

drop policy if exists "admin gestiona profesionales" on profesionales;
create policy "admin gestiona profesionales"
  on profesionales for all to authenticated
  using (es_admin()) with check (es_admin());

drop policy if exists "equipo gestiona citas" on citas;
create policy "equipo gestiona citas"
  on citas for all to authenticated
  using (true) with check (true);

-- Sin políticas para anon: la web pública no toca la base (reserva por WhatsApp).

-- ---------- seed neutro (nombres editables desde el panel) ----------
-- Horario Lun–Sáb 9:00–18:00 con almuerzo 12:30–14:00. Domingo cerrado.
insert into profesionales (id, nombre, email, color, activo, es_admin, horarios, capacidad_diaria) values
  ('pro-fran', 'Francy Molano', 'ADMIN@EJEMPLO.COM', '#8BA99A', true, true,
   '[{"dia":1,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":2,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":3,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":4,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":5,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":6,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}}]'::jsonb,
   8),
  ('pro-2', 'Profesional 2', null, '#25D366', true, false,
   '[{"dia":1,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":2,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":3,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":4,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":5,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":6,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}}]'::jsonb,
   8),
  ('pro-3', 'Profesional 3', null, '#E8A090', true, false,
   '[{"dia":1,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":2,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":3,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":4,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":5,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}},{"dia":6,"apertura":540,"cierre":1080,"pausa":{"inicio":750,"fin":840}}]'::jsonb,
   8)
on conflict (id) do nothing;
