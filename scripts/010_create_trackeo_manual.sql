-- Trackeo manual overrides table
create table if not exists public.trackeo_manual (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  year int not null,
  month int not null, -- 1..12
  section text not null, -- e.g. 'reservas_vs_cierres', 'numerico', 'capital_humano', 'evolucion_cartera'
  key text not null, -- column identifier
  value numeric null,
  text_value text null,
  notes text null,
  created_at timestamptz default now()
);

alter table public.trackeo_manual enable row level security;

create policy "trackeo_manual_select"
  on public.trackeo_manual for select
  using (auth.uid() = manager_id or public.is_admin());

create policy "trackeo_manual_insert"
  on public.trackeo_manual for insert
  with check (auth.uid() = manager_id);

create policy "trackeo_manual_update"
  on public.trackeo_manual for update
  using (auth.uid() = manager_id);

create policy "trackeo_manual_delete"
  on public.trackeo_manual for delete
  using (auth.uid() = manager_id);
