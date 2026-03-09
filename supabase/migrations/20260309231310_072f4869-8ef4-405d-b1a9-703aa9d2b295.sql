
-- Promo codes table
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  plan text NOT NULL,
  duration_days integer, -- NULL = lifetime
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Promo redemptions table
CREATE TABLE public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, promo_code_id)
);

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions" ON public.promo_redemptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Add plan_expires_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

-- Seed promo codes
INSERT INTO public.promo_codes (code, plan, duration_days, max_uses) VALUES
  ('SAFADO55', 'pro', 30, NULL),
  ('DANEL77', 'vip', 30, NULL),
  ('MERNIELA25', 'vip', NULL, 1);

-- Redeem function
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code text, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo RECORD;
  v_expires_at timestamptz;
BEGIN
  SELECT * INTO v_promo FROM public.promo_codes WHERE code = upper(trim(p_code)) AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código promocional inválido';
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RAISE EXCEPTION 'Código promocional esgotado';
  END IF;

  IF EXISTS (SELECT 1 FROM public.promo_redemptions WHERE user_id = p_user_id AND promo_code_id = v_promo.id) THEN
    RAISE EXCEPTION 'Você já utilizou este código';
  END IF;

  IF v_promo.duration_days IS NOT NULL THEN
    v_expires_at := now() + (v_promo.duration_days || ' days')::interval;
  ELSE
    v_expires_at := NULL;
  END IF;

  UPDATE public.profiles SET plan = v_promo.plan, plan_expires_at = v_expires_at WHERE user_id = p_user_id;

  INSERT INTO public.promo_redemptions (user_id, promo_code_id) VALUES (p_user_id, v_promo.id);

  UPDATE public.promo_codes SET current_uses = current_uses + 1 WHERE id = v_promo.id;

  RETURN v_promo.plan;
END;
$$;
