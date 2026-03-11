
-- Re-create the payment confirmation trigger
CREATE OR REPLACE TRIGGER trg_payment_confirmed
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.on_payment_confirmed();

-- Re-create the updated_at trigger for payment_settings
CREATE OR REPLACE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
