-- Trackeo Diario table
create table if not exists public.trackeo_diario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  llamadas int not null default 0,
  r1 int not null default 0,
  expertise int not null default 0,
  captaciones int not null default 0,
  captaciones_valor numeric not null default 0,
  busquedas int not null default 0,
  consultas int not null default 0,
  visitas int not null default 0,
  r2 int not null default 0,
  reservas_puntas numeric not null default 0,
  reservas_valor_oferta numeric not null default 0,
  devoluciones_puntas numeric not null default 0,
  devoluciones_honorarios numeric not null default 0,
  cierres_operaciones_puntas numeric not null default 0,
  cierres_honorarios numeric not null default 0,
  created_at timestamptz default now(),
  unique(user_id, fecha)
);

alter table public.trackeo_diario enable row level security;

create policy "trackeo_select"
  on public.trackeo_diario for select
  using (auth.uid() = user_id or public.is_admin());

create policy "trackeo_insert"
  on public.trackeo_diario for insert
  with check (auth.uid() = user_id);

create policy "trackeo_update"
  on public.trackeo_diario for update
  using (auth.uid() = user_id);

create policy "trackeo_delete"
  on public.trackeo_diario for delete
  using (auth.uid() = user_id);
