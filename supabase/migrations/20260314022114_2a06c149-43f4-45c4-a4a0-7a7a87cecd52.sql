
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'tokens';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS plan_name text;
