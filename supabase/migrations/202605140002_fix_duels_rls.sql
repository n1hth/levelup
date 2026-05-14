-- Fix RLS for duels so players can update them
alter table public.duels enable row level security;

drop policy if exists "Users can read own duels" on public.duels;
drop policy if exists "Users can insert own duels" on public.duels;
drop policy if exists "Users can update own duels" on public.duels;

create policy "Users can read own duels"
on public.duels for select to authenticated
using (auth.uid() = player1_id or auth.uid() = player2_id);

create policy "Users can insert own duels"
on public.duels for insert to authenticated
with check (auth.uid() = player1_id or auth.uid() = player2_id);

create policy "Users can update own duels"
on public.duels for update to authenticated
using (auth.uid() = player1_id or auth.uid() = player2_id)
with check (auth.uid() = player1_id or auth.uid() = player2_id);
