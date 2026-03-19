ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS favorite_subjects text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficulties text[] DEFAULT '{}';