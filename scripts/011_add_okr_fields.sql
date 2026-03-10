-- Add OKR-related fields to cierres
-- regalias: franchise/royalty fee amount
-- director_monto: director payment amount
-- martillero_monto: licensed broker payment amount

ALTER TABLE public.cierres
  ADD COLUMN IF NOT EXISTS regalias numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS director_monto numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS martillero_monto numeric NOT NULL DEFAULT 0;
