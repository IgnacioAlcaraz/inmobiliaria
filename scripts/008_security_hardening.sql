-- =============================================================================
-- 008_security_hardening.sql
-- Security hardening: fix privilege escalation + add missing RLS policies
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fix handle_new_user() trigger: ignore client-supplied role.
--    All new users are 'vendedor'. Role promotion must be done by an admin.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Sin nombre'),
    'vendedor'   -- always 'vendedor'; admins promote via the admin panel
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Add explicit RLS policy: admins can update any profile (for role changes)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

CREATE POLICY "profiles_update_admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Add explicit RLS DELETE policy for chat_messages (scoped to owner).
--    Without this, the client-side delete in chat-content.tsx could affect
--    all rows if the table has no DELETE policy.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chat_messages'
  ) THEN
    -- Drop any existing permissive delete policy
    EXECUTE $inner$DROP POLICY IF EXISTS "chat_messages_delete_own" ON public.chat_messages$inner$;

    -- Create scoped delete policy
    EXECUTE $inner$
      CREATE POLICY "chat_messages_delete_own"
      ON public.chat_messages FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id)
    $inner$;
  END IF;
END;
$$;
