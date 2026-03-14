-- Reset JARVIS45 promo code usage
UPDATE public.promo_codes SET current_uses = 0 WHERE code = 'JARVIS45';

-- Delete redemption records for JARVIS45
DELETE FROM public.promo_redemptions WHERE promo_code_id = 'cb3d5874-b306-4532-bc8e-7db5ff62eca4';

-- Reset user to free plan with 50 tokens
UPDATE public.profiles SET plan = 'free', plan_expires_at = NULL, tokens = 50 WHERE user_id = '374bfcb9-0188-4419-a4c0-56f95f3066bc';