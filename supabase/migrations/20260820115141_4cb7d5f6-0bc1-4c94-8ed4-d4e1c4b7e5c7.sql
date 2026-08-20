CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  price text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are publicly viewable" ON public.services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff can manage services" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL DEFAULT '',
  material text NOT NULL DEFAULT '',
  shape text NOT NULL DEFAULT '',
  colour text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  image_url text,
  in_stock boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.frames TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.frames TO authenticated;
GRANT ALL ON public.frames TO service_role;
ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Frames are publicly viewable" ON public.frames FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff can manage frames" ON public.frames FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  phone text NOT NULL,
  email text,
  service text,
  preferred_date date,
  preferred_time text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.appointments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request an appointment" ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff can view appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (true);

CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  patient_name text NOT NULL,
  phone text,
  age int,
  gender text,
  right_sph text,
  right_cyl text,
  right_axis text,
  left_sph text,
  left_cyl text,
  left_axis text,
  add_power text,
  pd text,
  lens_advice text,
  frame_advice text,
  diagnosis text[] NOT NULL DEFAULT '{}',
  notes text,
  file_path text,
  follow_up_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage own prescriptions" ON public.prescriptions FOR ALL TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Staff read prescription files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'prescriptions');
CREATE POLICY "Staff upload prescription files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'prescriptions');
CREATE POLICY "Staff delete prescription files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'prescriptions');

INSERT INTO public.services (name, tagline, description, duration, price, sort_order) VALUES
('Comprehensive Eye Examination', 'Complete vision and eye health check', 'Digital refraction, visual acuity, colour vision and slit-lamp examination performed by our optometrist.', '30 min', '₹300', 1),
('Computerised Eye Testing', 'Auto-refraction with digital accuracy', 'Automated refraction and keratometry for a precise, repeatable spectacle number.', '15 min', '₹200', 2),
('Contact Lens Fitting', 'Comfort-first lens trial and training', 'Corneal measurement, trial lenses and hygiene training for soft, toric and multifocal lenses.', '40 min', '₹700', 3),
('Child Vision Screening', 'Gentle testing for young eyes', 'Play-based screening for squint, lazy eye and early myopia, with a parent counselling session.', '25 min', '₹250', 4),
('Diabetic Retina Check', 'Retina screening for diabetic patients', 'Dilated fundus evaluation and retinal imaging to catch diabetic changes early.', '35 min', '₹800', 5),
('Spectacle Dispensing & Fitting', 'Frame styling and lens guidance', 'Frame selection by face shape, accurate PD measurement and fitting adjustments.', '20 min', 'Free with Rx', 6);

INSERT INTO public.frames (name, brand, material, shape, colour, price, in_stock, sort_order) VALUES
('Rania Full Rim', 'Misha Signature', 'Acetate', 'Cat-eye', 'Tortoise', 2490, true, 1),
('Kartar Titanium', 'Misha Signature', 'Titanium', 'Rectangle', 'Gunmetal', 3990, true, 2),
('Noor Rimless', 'Optiline', 'Titanium rimless', 'Oval', 'Rose gold', 4590, true, 3),
('Jalandhar Classic', 'Misha Heritage', 'Metal', 'Round', 'Antique gold', 1990, true, 4),
('Simar Kids Flex', 'FlexKid', 'TR90', 'Round', 'Sky blue', 1290, true, 5),
('Aman Blue-Cut', 'Misha Signature', 'Acetate', 'Square', 'Matte black', 2190, true, 6),
('Preet Aviator Sun', 'SunEdge', 'Metal', 'Aviator', 'Brown gradient', 2890, true, 7),
('Gurleen Slim', 'Optiline', 'Stainless steel', 'Cat-eye', 'Champagne', 3290, true, 8);