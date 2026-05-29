-- ════════════════════════════════════════
-- ADD HAS_PAID FIELD TO PROFILES FOR SECURE WEBHOOK VERIFICATION
-- ════════════════════════════════════════
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;
