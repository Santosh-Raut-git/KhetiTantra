-- ==============================================================================
-- KhetiTantra: Fix Infinite Recursion in Profiles Policy
-- ==============================================================================
-- Run this in the Supabase Dashboard SQL Editor to clean up any recursive
-- policies on the public.profiles table.

-- 1. Drop all potentially recursive SELECT policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.profiles;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.profiles;

-- 2. Re-create a clean, non-recursive SELECT policy for authenticated users
-- Using 'USING (true)' prevents Postgres from re-querying the profiles table during RLS evaluation.
CREATE POLICY "Authenticated users can read any profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Ensure write policies are restricted to the owner
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

