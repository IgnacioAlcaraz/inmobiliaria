-- =============================================================================
-- 014_create_objetivos_anuales.sql
-- Tabla de objetivos anuales del equipo, usada por OKR Global del manager.
-- Diferencias vs tabla "objetivos" existente:
--   - usa "year" en lugar de "anio"
--   - agrega "objetivo_comisiones_brutas" (campo específico del OKR del centro)
-- El componente ManagerOkrGlobal lee: objetivo_comisiones_brutas ?? objetivo_facturacion_total
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.objetivos_anuales (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year                        int NOT NULL CHECK (year >= 2020 AND year <= 2100),
  objetivo_facturacion_total  numeric NOT NULL DEFAULT 0,    -- objetivo de facturación total
  objetivo_comisiones_brutas  numeric,                       -- objetivo específico de honorarios brutos (OKR centro)
  ticket_promedio_cartera     numeric NOT NULL DEFAULT 0,
  comision_agente_porcentaje  numeric NOT NULL DEFAULT 0,
  gastos_personales_anio      numeric NOT NULL DEFAULT 0,
  inversion_negocio_anio      numeric NOT NULL DEFAULT 0,
  ahorro_anio                 numeric NOT NULL DEFAULT 0,
  suenos_anio                 numeric NOT NULL DEFAULT 0,
  -- pesos mensuales (%)
  peso_enero                  numeric NOT NULL DEFAULT 0,
  peso_febrero                numeric NOT NULL DEFAULT 0,
  peso_marzo                  numeric NOT NULL DEFAULT 0,
  peso_abril                  numeric NOT NULL DEFAULT 0,
  peso_mayo                   numeric NOT NULL DEFAULT 0,
  peso_junio                  numeric NOT NULL DEFAULT 0,
  peso_julio                  numeric NOT NULL DEFAULT 0,
  peso_agosto                 numeric NOT NULL DEFAULT 0,
  peso_septiembre             numeric NOT NULL DEFAULT 0,
  peso_octubre                numeric NOT NULL DEFAULT 0,
  peso_noviembre              numeric NOT NULL DEFAULT 0,
  peso_diciembre              numeric NOT NULL DEFAULT 0,
  created_at                  timestamptz DEFAULT now(),
  UNIQUE (user_id, year)
);

-- Index para queries por equipo y año (patrón del manager)
CREATE INDEX IF NOT EXISTS objetivos_anuales_user_year_idx
  ON public.objetivos_anuales (user_id, year);

-- RLS
ALTER TABLE public.objetivos_anuales ENABLE ROW LEVEL SECURITY;

-- Vendedor ve solo los suyos; encargado/admin ven los de su equipo
DROP POLICY IF EXISTS "objetivos_anuales_select" ON public.objetivos_anuales;
CREATE POLICY "objetivos_anuales_select"
  ON public.objetivos_anuales FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.manager_vendedores
      WHERE manager_id = auth.uid()
        AND vendedor_id = objetivos_anuales.user_id
    )
  );

DROP POLICY IF EXISTS "objetivos_anuales_insert" ON public.objetivos_anuales;
CREATE POLICY "objetivos_anuales_insert"
  ON public.objetivos_anuales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "objetivos_anuales_update" ON public.objetivos_anuales;
CREATE POLICY "objetivos_anuales_update"
  ON public.objetivos_anuales FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "objetivos_anuales_delete" ON public.objetivos_anuales;
CREATE POLICY "objetivos_anuales_delete"
  ON public.objetivos_anuales FOR DELETE
  USING (auth.uid() = user_id);
