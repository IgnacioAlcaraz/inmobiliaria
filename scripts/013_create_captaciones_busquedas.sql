-- =============================================================================
-- 013_create_captaciones_busquedas.sql
-- Tabla de captaciones y búsquedas del equipo, usada por las vistas del manager
-- (Trackeo Cartera, Tablero Gestión, Trackeo Global).
-- Estructura idéntica a "captaciones" pero con "pct_dif_precio" (nombre corto)
-- y "codigo_id" como identificador legible opcional.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.captaciones_busquedas (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo_id                   text,                              -- identificador legible opcional (ej: "VTA-001")
  fecha_alta                  date NOT NULL,
  autorizacion                text,
  direccion                   text NOT NULL,
  barrio                      text,
  ciudad                      text,
  vence                       date,
  adenda                      text,
  operacion                   text NOT NULL CHECK (operacion IN ('Venta', 'Alquiler', 'Temporario')),
  valor_publicado             numeric NOT NULL DEFAULT 0,
  fecha_baja                  date,
  moneda                      text NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'ARS')),
  oferta                      numeric,
  pct_dif_precio              numeric,                          -- % diferencia entre publicado y oferta
  fecha_reserva               date,
  fecha_aceptacion            date,
  fecha_notificacion          date,
  fecha_refuerzo              date,
  fecha_cierre                date,
  honorarios_totales          numeric,
  comision_agente_porcentaje  numeric,
  comision_agente_monto       numeric,
  observaciones               text,
  created_at                  timestamptz DEFAULT now()
);

-- Indexes para los patrones de query del manager (por equipo + año)
CREATE INDEX IF NOT EXISTS captaciones_busquedas_user_fecha_idx
  ON public.captaciones_busquedas (user_id, fecha_alta DESC);

CREATE INDEX IF NOT EXISTS captaciones_busquedas_operacion_idx
  ON public.captaciones_busquedas (operacion);

-- RLS
ALTER TABLE public.captaciones_busquedas ENABLE ROW LEVEL SECURITY;

-- Vendedor ve solo los suyos; encargado/admin ven los de su equipo (vía manager_vendedores)
DROP POLICY IF EXISTS "captaciones_busquedas_select" ON public.captaciones_busquedas;
CREATE POLICY "captaciones_busquedas_select"
  ON public.captaciones_busquedas FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.manager_vendedores
      WHERE manager_id = auth.uid()
        AND vendedor_id = captaciones_busquedas.user_id
    )
  );

DROP POLICY IF EXISTS "captaciones_busquedas_insert" ON public.captaciones_busquedas;
CREATE POLICY "captaciones_busquedas_insert"
  ON public.captaciones_busquedas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "captaciones_busquedas_update" ON public.captaciones_busquedas;
CREATE POLICY "captaciones_busquedas_update"
  ON public.captaciones_busquedas FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "captaciones_busquedas_delete" ON public.captaciones_busquedas;
CREATE POLICY "captaciones_busquedas_delete"
  ON public.captaciones_busquedas FOR DELETE
  USING (auth.uid() = user_id);
