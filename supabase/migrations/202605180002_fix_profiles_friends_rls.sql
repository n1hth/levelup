-- ═══════════════════════════════════════════════════════════════
-- SUPABASE PROFILES, FRIENDS & MESSAGES RLS REPAIR PATCH
-- ═══════════════════════════════════════════════════════════════
-- Run this block directly inside your Supabase SQL Editor.
-- It establishes the correct Row Level Security (RLS) policies
-- so that users can search other hunters, receive friend requests,
-- accept requests, and read/send direct message signals correctly!

BEGIN;

-- ════════════════════════════════════════
-- 1. public.profiles RLS
-- ════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.profiles;
CREATE POLICY "Enable read access for all authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Enable update access for users to their own profile" ON public.profiles;
CREATE POLICY "Enable update access for users to their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Enable insert access for users to their own profile" ON public.profiles;
CREATE POLICY "Enable insert access for users to their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


-- ════════════════════════════════════════
-- 2. public.friends RLS
-- ════════════════════════════════════════
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own friendships" ON public.friends;
CREATE POLICY "Users can read own friendships"
  ON public.friends FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can insert own friendships" ON public.friends;
CREATE POLICY "Users can insert own friendships"
  ON public.friends FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own friendships" ON public.friends;
CREATE POLICY "Users can update own friendships"
  ON public.friends FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friends;
CREATE POLICY "Users can delete own friendships"
  ON public.friends FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);


-- ════════════════════════════════════════
-- 3. public.messages RLS
-- ════════════════════════════════════════
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;
CREATE POLICY "Users can read own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

COMMIT;
