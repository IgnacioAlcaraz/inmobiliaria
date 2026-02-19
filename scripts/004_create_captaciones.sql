-- Captaciones y Busquedas table
create table if not exists public.captaciones_busquedas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  codigo_id text,
  fecha_alta date not null,
  autorizacion text,
  direccion text,
  barrio text,
  ciudad text,
  vence date,
  adenda text,
  operacion text,
  valor_publicado numeric default 0,
  fecha_baja date,
  moneda text default 'USD',
  oferta numeric default 0,
  pct_dif_precio numeric default 0,
  fecha_reserva date,
  fecha_aceptacion date,
  fecha_notificacion date,
  fecha_refuerzo date,
  fecha_cierre date,
  honorarios_totales numeric default 0,
  created_at timestamptz default now()
);

alter table public.captaciones_busquedas enable row level security;

create policy "captaciones_select"
  on public.captaciones_busquedas for select
  using (auth.uid() = user_id or public.is_admin());

create policy "captaciones_insert"
  on public.captaciones_busquedas for insert
  with check (auth.uid() = user_id);

create policy "captaciones_update"
  on public.captaciones_busquedas for update
  using (auth.uid() = user_id);

create policy "captaciones_delete"
  on public.captaciones_busquedas for delete
  using (auth.uid() = user_id);
