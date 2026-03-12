-- Update instancia values to proper Spanish labels
ALTER TABLE public.contactos DROP CONSTRAINT IF EXISTS contacto_instancia_check;

-- Migrate existing data to new labels
UPDATE public.contactos SET instancia = 'Llamado / Prospeccion' WHERE instancia = 'llamado';
UPDATE public.contactos SET instancia = 'Reunion de Negocio'    WHERE instancia = 'reunion';
UPDATE public.contactos SET instancia = 'Pre Listing'           WHERE instancia = 'prelisting';
UPDATE public.contactos SET instancia = 'Captacion'             WHERE instancia = 'contacto';
UPDATE public.contactos SET instancia = 'Venta'                 WHERE instancia = 'venta';

-- Add new constraint with updated values
ALTER TABLE public.contactos
  ADD CONSTRAINT contacto_instancia_check
  CHECK (instancia IS NULL OR instancia IN (
    'Llamado / Prospeccion',
    'Reunion de Negocio',
    'Pre Listing',
    'Captacion',
    'Venta'
  ));

-- Add grupo column
ALTER TABLE public.contactos
  ADD COLUMN IF NOT EXISTS grupo text;

ALTER TABLE public.contactos
  ADD CONSTRAINT contacto_grupo_check
  CHECK (grupo IS NULL OR grupo IN ('Familia', 'Amigos', 'Trabajo', 'Colegio', 'Vecinos'));

-- Add personal fields
ALTER TABLE public.contactos ADD COLUMN IF NOT EXISTS fecha_nacimiento date;
ALTER TABLE public.contactos ADD COLUMN IF NOT EXISTS estado_civil    text;
ALTER TABLE public.contactos ADD COLUMN IF NOT EXISTS hijos           text;
ALTER TABLE public.contactos ADD COLUMN IF NOT EXISTS deportes        text;
ALTER TABLE public.contactos ADD COLUMN IF NOT EXISTS hobbies         text;
