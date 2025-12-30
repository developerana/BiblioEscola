-- Add is_active column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Update auth check to consider is_active status
COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user account is active and can log in';