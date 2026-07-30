-- 1. ADD COLUMN
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. CREATE FUNCTION TO PREVENT UNAUTHORIZED ADMIN ESCALATION
CREATE OR REPLACE FUNCTION public.prevent_is_admin_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the is_admin column is being changed
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    -- Check if the request is coming from a standard authenticated user via the API
    IF current_setting('request.jwt.claim.role', true) = 'authenticated' THEN
      -- Silently revert the change back to the old value
      NEW.is_admin = OLD.is_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ATTACH TRIGGER TO PROFILES TABLE
DROP TRIGGER IF EXISTS check_is_admin_update ON public.profiles;
CREATE TRIGGER check_is_admin_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_is_admin_update();
