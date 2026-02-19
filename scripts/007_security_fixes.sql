-- 1. Update profiles role check constraint
-- First, we need to find the name of the existing constraint if it exists, 
-- but since we're using 'create table if not exists', we can just drop and recreate it 
-- or use a DO block to safely update it.

DO $$ 
BEGIN 
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'vendedor', 'encargado'));
END $$;

-- 2. Ensure manager_vendedores table exists and has RLS
CREATE TABLE IF NOT EXISTS public.manager_vendedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vendedor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manager_id, vendedor_id)
);

ALTER TABLE public.manager_vendedores ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for manager_vendedores

-- Admins can do everything
CREATE POLICY "managers_admin_all" 
ON public.manager_vendedores 
FOR ALL 
TO authenticated 
USING (public.is_admin());

-- Managers (encargados) can see their own assignments
CREATE POLICY "managers_select_own" 
ON public.manager_vendedores 
FOR SELECT 
TO authenticated 
USING (auth.uid() = manager_id);

-- Vendedores can see who their manager is
CREATE POLICY "vendedores_select_own_manager" 
ON public.manager_vendedores 
FOR SELECT 
TO authenticated 
USING (auth.uid() = vendedor_id);

-- 4. Audit Log Table (Optional but recommended)
-- This would track sensitive changes, but let's keep it simple for now.

-- 5. Secure profiles table select
-- Ensure that the profiles_select_own_or_admin policy is actually sufficient.
-- Sometimes we need to allow users to see other users' basic info (name, role)
-- for selection lists.

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;

CREATE POLICY "profiles_select_all_authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
-- Note: This allows any logged in user to see names and roles of others. 
-- This is usually acceptable and necessary for UI dropdowns.

-- 6. Ensure is_admin function is solid (redundant but safe)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
