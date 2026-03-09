
-- RLS policy for promo_codes: no direct access, only via security definer function
CREATE POLICY "No direct access to promo_codes" ON public.promo_codes
  FOR SELECT TO authenticated USING (false);
