-- Cierres table
create table if not exists public.cierres (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  id_direccion text,
  valor_cierre numeric not null default 0,
  pct_honorarios numeric not null default 0,
  pct_agente numeric not null default 0,
  honorarios_totales numeric not null default 0,
  comision_agente numeric not null default 0,
  total_puntas numeric not null default 0,
  created_at timestamptz default now()
);

alter table public.cierres enable row level security;

create policy "cierres_select"
  on public.cierres for select
  using (auth.uid() = user_id or public.is_admin());

create policy "cierres_insert"
  on public.cierres for insert
  with check (auth.uid() = user_id);

create policy "cierres_update"
  on public.cierres for update
  using (auth.uid() = user_id);

create policy "cierres_delete"
  on public.cierres for delete
  using (auth.uid() = user_id);
