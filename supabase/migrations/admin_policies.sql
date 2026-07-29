-- Super Admin RLS Policies
-- This migration adds policies that allow designated super admin users to view all data.
-- Admin users are identified by their email addresses.

-- Create a function to check if the current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT email IN ('admin@khetitantra.com', 'santosh@khetitantra.com')
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES: Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_super_admin());

-- PROFILES: Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.is_super_admin());

-- CROPS: Allow admins to view all crops
CREATE POLICY "Admins can view all crops" ON public.crops
  FOR SELECT USING (public.is_super_admin());

-- CROPS: Allow admins to delete any crop
CREATE POLICY "Admins can delete any crop" ON public.crops
  FOR DELETE USING (public.is_super_admin());

-- TRANSACTIONS: Allow admins to view all transactions
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (public.is_super_admin());

-- TRANSACTIONS: Allow admins to delete any transaction
CREATE POLICY "Admins can delete any transaction" ON public.transactions
  FOR DELETE USING (public.is_super_admin());

-- AI_CONVERSATIONS: Allow admins to view all conversations
CREATE POLICY "Admins can view all conversations" ON public.ai_conversations
  FOR SELECT USING (public.is_super_admin());

-- AI_MESSAGES: Allow admins to view all messages
CREATE POLICY "Admins can view all messages" ON public.ai_messages
  FOR SELECT USING (public.is_super_admin());