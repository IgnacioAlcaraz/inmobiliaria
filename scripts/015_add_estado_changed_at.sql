-- Add estado_changed_at to contactos and auto-update it via trigger

ALTER TABLE public.contactos
  ADD COLUMN IF NOT EXISTS estado_changed_at timestamptz;

-- Initialize with updated_at for existing rows
UPDATE public.contactos
SET estado_changed_at = updated_at
WHERE estado_changed_at IS NULL;

-- Trigger function: sets estado_changed_at when estado changes
CREATE OR REPLACE FUNCTION public.contactos_set_estado_changed_at()
RETURNS trigger AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    NEW.estado_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contactos_estado_changed ON public.contactos;

CREATE TRIGGER contactos_estado_changed
  BEFORE UPDATE ON public.contactos
  FOR EACH ROW
  EXECUTE FUNCTION public.contactos_set_estado_changed_at();
