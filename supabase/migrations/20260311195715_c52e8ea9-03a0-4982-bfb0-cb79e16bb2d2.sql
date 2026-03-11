
-- Create payment_settings table (single-row config)
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mpesa_number text NOT NULL DEFAULT '',
  mpesa_name text NOT NULL DEFAULT '',
  emola_number text NOT NULL DEFAULT '',
  emola_name text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read payment settings (needed for checkout)
CREATE POLICY "Anyone can view payment_settings"
  ON public.payment_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update payment_settings"
  ON public.payment_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert
CREATE POLICY "Admins can insert payment_settings"
  ON public.payment_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default values
INSERT INTO public.payment_settings (mpesa_number, mpesa_name, emola_number, emola_name)
VALUES ('855430949', 'Elmer Gumissanhe', '873702423', 'Cossilia Manuel Chamunorga');
