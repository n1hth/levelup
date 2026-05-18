-- ═══════════════════════════════════════════════════════════════
-- SUPABASE AUTH USER DELETION CASCADE REPAIR
-- ═══════════════════════════════════════════════════════════════
-- Run this block directly inside your Supabase SQL Editor.
-- It recreates all foreign key constraints with ON DELETE CASCADE
-- so that deleting a user from the Supabase Authentication panel
-- automatically deletes all associated data cleanly!

BEGIN;

-- 1. Profiles table -> auth.users (id)
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Decks table -> profiles (id)
ALTER TABLE public.decks 
  DROP CONSTRAINT IF EXISTS decks_user_id_fkey,
  ADD CONSTRAINT decks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Cards table -> profiles (id)
ALTER TABLE public.cards 
  DROP CONSTRAINT IF EXISTS cards_user_id_fkey,
  ADD CONSTRAINT cards_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Friends table -> profiles (id)
ALTER TABLE public.friends 
  DROP CONSTRAINT IF EXISTS friends_user_id_fkey,
  DROP CONSTRAINT IF EXISTS friends_friend_id_fkey,
  ADD CONSTRAINT friends_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT friends_friend_id_fkey 
    FOREIGN KEY (friend_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. Duels table -> profiles (id)
ALTER TABLE public.duels 
  DROP CONSTRAINT IF EXISTS duels_player1_id_fkey,
  DROP CONSTRAINT IF EXISTS duels_player2_id_fkey,
  ADD CONSTRAINT duels_player1_id_fkey 
    FOREIGN KEY (player1_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT duels_player2_id_fkey 
    FOREIGN KEY (player2_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 6. Messages table -> profiles (id)
ALTER TABLE public.messages 
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
  DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey,
  ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT messages_receiver_id_fkey 
    FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

COMMIT;
