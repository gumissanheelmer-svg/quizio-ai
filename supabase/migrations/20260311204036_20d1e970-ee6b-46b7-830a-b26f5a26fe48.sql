
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code text, p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_promo RECORD;
  v_expires_at timestamptz;
  v_bonus_tokens integer;
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

  -- Determine bonus tokens based on plan
  CASE v_promo.plan
    WHEN 'vip' THEN v_bonus_tokens := 1800;
    WHEN 'pro' THEN v_bonus_tokens := 600;
    WHEN 'elite' THEN v_bonus_tokens := 1000;
    ELSE v_bonus_tokens := 0;
  END CASE;

  -- Update plan
  UPDATE public.profiles SET plan = v_promo.plan, plan_expires_at = v_expires_at WHERE user_id = p_user_id;

  -- Credit tokens
  IF v_bonus_tokens > 0 THEN
    PERFORM public.credit_tokens(p_user_id, v_bonus_tokens, 'Código promocional: ' || upper(trim(p_code)) || ' - Plano ' || upper(v_promo.plan));
  END IF;

  INSERT INTO public.promo_redemptions (user_id, promo_code_id) VALUES (p_user_id, v_promo.id);

  UPDATE public.promo_codes SET current_uses = current_uses + 1 WHERE id = v_promo.id;

  RETURN v_promo.plan;
END;
$function$;
