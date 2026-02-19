-- Objetivos Anuales table
create table if not exists public.objetivos_anuales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  ticket_promedio_actual_individual numeric default 0,
  ticket_promedio_objetivo_individual numeric default 0,
  comisiones_reales numeric default 0,
  objetivo_comisiones_brutas numeric default 0,
  objetivo_facturacion_total numeric default 0,
  gastos_personales_anio numeric default 0,
  inversion_negocio_anio numeric default 0,
  ahorro_anio numeric default 0,
  suenos_anio numeric default 0,
  created_at timestamptz default now(),
  unique(user_id, year)
);

alter table public.objetivos_anuales enable row level security;

create policy "objetivos_select"
  on public.objetivos_anuales for select
  using (auth.uid() = user_id or public.is_admin());

create policy "objetivos_insert"
  on public.objetivos_anuales for insert
  with check (auth.uid() = user_id);

create policy "objetivos_update"
  on public.objetivos_anuales for update
  using (auth.uid() = user_id);

create policy "objetivos_delete"
  on public.objetivos_anuales for delete
  using (auth.uid() = user_id);
