
UPDATE public.promo_codes SET current_uses = 0 WHERE code IN ('JARVIS45', 'MERNIELA55');
DELETE FROM public.promo_redemptions WHERE user_id = '374bfcb9-0188-4419-a4c0-56f95f3066bc';
UPDATE public.profiles SET plan = 'free', plan_expires_at = NULL, tokens = 50 WHERE user_id = '374bfcb9-0188-4419-a4c0-56f95f3066bc';
