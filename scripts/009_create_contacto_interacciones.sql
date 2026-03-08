-- Add classification and instancia to contactos, create contacto_interacciones
alter table if exists public.contactos
  add column if not exists clasificacion text;

alter table if exists public.contactos
  add column if not exists instancia text default 'contacto';

-- Add checks for allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contacto_clasificacion_check'
      AND conrelid = 'public.contactos'::regclass
  ) THEN
    ALTER TABLE public.contactos
      ADD CONSTRAINT contacto_clasificacion_check CHECK (clasificacion IS NULL OR clasificacion IN ('A+','A','B','C','D'));
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contacto_instancia_check'
      AND conrelid = 'public.contactos'::regclass
  ) THEN
    ALTER TABLE public.contactos
      ADD CONSTRAINT contacto_instancia_check CHECK (instancia IN ('contacto','llamado','prelisting','reunion','venta'));
  END IF;
END;
$$;

-- Create contacto_interacciones table
create table if not exists public.contacto_interacciones (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.contactos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('llamada','prelisting','reunion','visita','reserva','cierre','nota')),
  fecha timestamptz default now(),
  duracion int,
  resultado text,
  notas text,
  created_at timestamptz default now()
);

alter table public.contacto_interacciones enable row level security;

create policy "contacto_interacciones_select"
  on public.contacto_interacciones for select
  using (auth.uid() = user_id or public.is_admin());

create policy "contacto_interacciones_insert"
  on public.contacto_interacciones for insert
  with check (auth.uid() = user_id);

create policy "contacto_interacciones_update"
  on public.contacto_interacciones for update
  using (auth.uid() = user_id);

create policy "contacto_interacciones_delete"
  on public.contacto_interacciones for delete
  using (auth.uid() = user_id);

-- Function to propagate interaction into trackeo_diario
create or replace function public.handle_contacto_interaccion_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (new.fecha at time zone 'utc')::date;
  inc_llamadas int := 0;
  inc_captaciones int := 0;
  inc_captaciones_valor numeric := 0;
  inc_reservas_puntas numeric := 0;
  inc_reservas_valor_oferta numeric := 0;
  inc_cierres_operaciones_puntas numeric := 0;
  inc_cierres_honorarios numeric := 0;
begin
  if new.tipo = 'llamada' then
    inc_llamadas := 1;
  elsif new.tipo = 'prelisting' then
    inc_captaciones := 1;
    inc_captaciones_valor := coalesce(nullif(new.resultado, '')::numeric, 0);
  elsif new.tipo = 'reserva' then
    inc_reservas_puntas := 1;
    inc_reservas_valor_oferta := coalesce(nullif(new.resultado, '')::numeric, 0);
  elsif new.tipo = 'cierre' then
    inc_cierres_operaciones_puntas := 1;
    inc_cierres_honorarios := coalesce(nullif(new.resultado, '')::numeric, 0);
  end if;

  insert into public.trackeo_diario (user_id, fecha, llamadas, captaciones, captaciones_valor, reservas_puntas, reservas_valor_oferta, cierres_operaciones_puntas, cierres_honorarios, created_at)
  values (new.user_id, d, inc_llamadas, inc_captaciones, inc_captaciones_valor, inc_reservas_puntas, inc_reservas_valor_oferta, inc_cierres_operaciones_puntas, inc_cierres_honorarios, now())
  on conflict (user_id, fecha) do update set
    llamadas = trackeo_diario.llamadas + excluded.llamadas,
    captaciones = trackeo_diario.captaciones + excluded.captaciones,
    captaciones_valor = trackeo_diario.captaciones_valor + excluded.captaciones_valor,
    reservas_puntas = trackeo_diario.reservas_puntas + excluded.reservas_puntas,
    reservas_valor_oferta = trackeo_diario.reservas_valor_oferta + excluded.reservas_valor_oferta,
    cierres_operaciones_puntas = trackeo_diario.cierres_operaciones_puntas + excluded.cierres_operaciones_puntas,
    cierres_honorarios = trackeo_diario.cierres_honorarios + excluded.cierres_honorarios;

  return new;
end;
$$;

drop trigger if exists contacto_interacciones_after_insert on public.contacto_interacciones;
create trigger contacto_interacciones_after_insert
  after insert on public.contacto_interacciones
  for each row
  execute function public.handle_contacto_interaccion_insert();
