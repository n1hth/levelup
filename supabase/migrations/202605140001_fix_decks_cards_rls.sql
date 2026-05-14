-- Repair LevelUp deck/card persistence policies.
-- Run this in the Supabase SQL editor or apply it with the Supabase CLI.

alter table public.decks enable row level security;
alter table public.cards enable row level security;

drop policy if exists "Users can select own decks" on public.decks;
drop policy if exists "Users can insert own decks" on public.decks;
drop policy if exists "Users can update own decks" on public.decks;
drop policy if exists "Users can delete own decks" on public.decks;

create policy "Users can select own decks"
on public.decks
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own decks"
on public.decks
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own decks"
on public.decks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own decks"
on public.decks
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can select own cards" on public.cards;
drop policy if exists "Users can insert own cards" on public.cards;
drop policy if exists "Users can update own cards" on public.cards;
drop policy if exists "Users can delete own cards" on public.cards;

create policy "Users can select own cards"
on public.cards
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own cards"
on public.cards
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own cards"
on public.cards
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own cards"
on public.cards
for delete
to authenticated
using (auth.uid() = user_id);
