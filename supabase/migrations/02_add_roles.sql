-- Add role column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'farmer' CHECK (role IN ('farmer', 'retailer'));

-- Update the handle_new_user trigger to capture the role from metadata during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'farmer') -- Default to farmer if not provided
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
