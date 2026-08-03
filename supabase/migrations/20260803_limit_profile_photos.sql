-- Enforce the product-wide limit even when a request bypasses the UI.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_photos_max_3;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_photos_max_3
  CHECK (cardinality(photos) <= 3);
