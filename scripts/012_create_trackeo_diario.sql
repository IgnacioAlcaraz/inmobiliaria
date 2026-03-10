-- =============================================================================
-- 012_create_trackeo_diario.sql
-- Tabla de trackeo diario agregado por usuario/fecha.
-- Es diferente a "trackeo" (entrada manual libre); esta tabla se alimenta
-- automáticamente via trigger desde contacto_interacciones (script 009) y
-- también puede recibir inserts directos del agente.
-- Unique constraint en (user_id, fecha) para permitir upserts en el trigger.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.trackeo_diario (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha                     date NOT NULL,
  llamadas                  numeric NOT NULL DEFAULT 0,
  visitas                   numeric NOT NULL DEFAULT 0,
  captaciones               numeric NOT NULL DEFAULT 0,
  captaciones_valor         numeric NOT NULL DEFAULT 0,
  reservas_puntas           numeric NOT NULL DEFAULT 0,
  reservas_valor_oferta     numeric NOT NULL DEFAULT 0,
  cierres_operaciones_puntas numeric NOT NULL DEFAULT 0,
  cierres_honorarios        numeric NOT NULL DEFAULT 0,
  created_at                timestamptz DEFAULT now()
);

-- Unique constraint requerido por el trigger ON CONFLICT (user_id, fecha) del script 009
ALTER TABLE public.trackeo_diario
  DROP CONSTRAINT IF EXISTS trackeo_diario_user_fecha_unique;

ALTER TABLE public.trackeo_diario
  ADD CONSTRAINT trackeo_diario_user_fecha_unique UNIQUE (user_id, fecha);

-- Index para queries por usuario y rango de fechas (patrón más común)
CREATE INDEX IF NOT EXISTS trackeo_diario_user_fecha_idx
  ON public.trackeo_diario (user_id, fecha DESC);

-- RLS
ALTER TABLE public.trackeo_diario ENABLE ROW LEVEL SECURITY;

-- Vendedor ve solo sus propios registros; admin ve todos
DROP POLICY IF EXISTS "trackeo_diario_select" ON public.trackeo_diario;
CREATE POLICY "trackeo_diario_select"
  ON public.trackeo_diario FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "trackeo_diario_insert" ON public.trackeo_diario;
CREATE POLICY "trackeo_diario_insert"
  ON public.trackeo_diario FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trackeo_diario_update" ON public.trackeo_diario;
CREATE POLICY "trackeo_diario_update"
  ON public.trackeo_diario FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trackeo_diario_delete" ON public.trackeo_diario;
CREATE POLICY "trackeo_diario_delete"
  ON public.trackeo_diario FOR DELETE
  USING (auth.uid() = user_id);
