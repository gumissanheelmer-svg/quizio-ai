
-- debit_tokens: verifica saldo, deduz e registra
CREATE OR REPLACE FUNCTION public.debit_tokens(p_user_id uuid, p_amount integer, p_description text DEFAULT 'Uso de funcionalidade')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tokens integer;
BEGIN
  SELECT tokens INTO current_tokens FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF current_tokens IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;
  IF current_tokens < p_amount THEN
    RAISE EXCEPTION 'Tokens insuficientes. Saldo: %, Necessário: %', current_tokens, p_amount;
  END IF;
  UPDATE public.profiles SET tokens = tokens - p_amount WHERE user_id = p_user_id;
  INSERT INTO public.token_transactions (user_id, type, tokens, description)
    VALUES (p_user_id, 'debit', p_amount, p_description);
END;
$$;

-- credit_tokens: adiciona e registra
CREATE OR REPLACE FUNCTION public.credit_tokens(p_user_id uuid, p_amount integer, p_description text DEFAULT 'Crédito de tokens')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET tokens = tokens + p_amount WHERE user_id = p_user_id;
  INSERT INTO public.token_transactions (user_id, type, tokens, description)
    VALUES (p_user_id, 'credit', p_amount, p_description);
END;
$$;

-- Trigger: creditar tokens automaticamente quando pagamento é confirmado
CREATE OR REPLACE FUNCTION public.on_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    PERFORM public.credit_tokens(NEW.user_id, NEW.tokens, 'Pagamento confirmado: ' || NEW.transaction_code);
    NEW.confirmed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_confirmed
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.on_payment_confirmed();
