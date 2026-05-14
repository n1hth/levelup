-- Community-reviewed duel honours.
-- Run this in the Supabase SQL editor after the previous RLS repair.

alter table public.duels
  add column if not exists p1_honour_finalized boolean not null default false,
  add column if not exists p2_honour_finalized boolean not null default false,
  add column if not exists p1_honour_approved boolean,
  add column if not exists p2_honour_approved boolean,
  add column if not exists p1_honour_xp_awarded integer not null default 0,
  add column if not exists p2_honour_xp_awarded integer not null default 0,
  add column if not exists p1_honour_penalty_applied integer not null default 0,
  add column if not exists p2_honour_penalty_applied integer not null default 0;

create table if not exists public.community_duel_votes (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references public.duels(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  target_player text not null check (target_player in ('p1', 'p2')),
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  is_reasonable boolean not null,
  created_at timestamptz not null default now(),
  unique (duel_id, voter_id, target_player)
);

alter table public.community_duel_votes enable row level security;

drop policy if exists "Community can read honour votes" on public.community_duel_votes;
drop policy if exists "Authenticated users can create honour votes" on public.community_duel_votes;

create policy "Community can read honour votes"
on public.community_duel_votes
for select
to authenticated
using (true);

create policy "Authenticated users can create honour votes"
on public.community_duel_votes
for insert
to authenticated
with check (auth.uid() = voter_id);

create or replace function public.submit_community_honour_vote(
  p_duel_id uuid,
  p_target_player text,
  p_is_reasonable boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_duel public.duels%rowtype;
  v_target_user_id uuid;
  v_reviewer_id uuid;
  v_rating integer;
  v_total_votes integer;
  v_fair_votes integer;
  v_is_approved boolean;
  v_awarded_xp integer;
  v_other_finalized boolean;
  v_honour_xp_per_star constant integer := 50;
  v_vote_threshold constant integer := 3;
  v_unfair_penalty_xp constant integer := 100;
  v_unfair_compensation_xp constant integer := 50;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_target_player not in ('p1', 'p2') then
    raise exception 'Invalid target player.';
  end if;

  select * into v_duel
  from public.duels
  where id = p_duel_id
  for update;

  if not found then
    raise exception 'Duel not found.';
  end if;

  if v_duel.status <> 'community_review' then
    raise exception 'This duel is not open for community review.';
  end if;

  if p_target_player = 'p1' then
    v_target_user_id := v_duel.player1_id;
    v_reviewer_id := v_duel.player2_id;
    v_rating := coalesce(v_duel.p1_review_rating, 0);
    v_other_finalized := v_duel.p2_honour_finalized;

    if v_duel.p1_honour_finalized then
      raise exception 'This honour has already been finalized.';
    end if;
  else
    v_target_user_id := v_duel.player2_id;
    v_reviewer_id := v_duel.player1_id;
    v_rating := coalesce(v_duel.p2_review_rating, 0);
    v_other_finalized := v_duel.p1_honour_finalized;

    if v_duel.p2_honour_finalized then
      raise exception 'This honour has already been finalized.';
    end if;
  end if;

  if v_rating <= 0 then
    raise exception 'This honour has not been submitted yet.';
  end if;

  if v_user_id = v_target_user_id or v_user_id = v_reviewer_id then
    raise exception 'Duel participants cannot vote on their own honour review.';
  end if;

  insert into public.community_duel_votes (
    duel_id,
    voter_id,
    target_player,
    target_user_id,
    reviewer_id,
    is_reasonable
  ) values (
    p_duel_id,
    v_user_id,
    p_target_player,
    v_target_user_id,
    v_reviewer_id,
    p_is_reasonable
  );

  select count(*), count(*) filter (where is_reasonable)
  into v_total_votes, v_fair_votes
  from public.community_duel_votes
  where duel_id = p_duel_id
    and target_player = p_target_player;

  if v_total_votes < v_vote_threshold then
    return;
  end if;

  v_is_approved := v_fair_votes > (v_total_votes / 2.0);
  v_awarded_xp := case
    when v_is_approved then v_rating * v_honour_xp_per_star
    else v_unfair_compensation_xp
  end;

  if v_is_approved then
    update public.profiles
    set total_xp = greatest(0, coalesce(total_xp, 0) + v_awarded_xp)
    where id = v_target_user_id;
  else
    update public.profiles
    set total_xp = greatest(0, coalesce(total_xp, 0) - v_unfair_penalty_xp)
    where id = v_reviewer_id;

    update public.profiles
    set total_xp = greatest(0, coalesce(total_xp, 0) + v_unfair_compensation_xp)
    where id = v_target_user_id;
  end if;

  if p_target_player = 'p1' then
    update public.duels
    set p1_honour_finalized = true,
        p1_honour_approved = v_is_approved,
        p1_honour_xp_awarded = v_awarded_xp,
        p1_honour_penalty_applied = case when v_is_approved then 0 else v_unfair_penalty_xp end,
        status = case when v_other_finalized then 'finished' else status end
    where id = p_duel_id;
  else
    update public.duels
    set p2_honour_finalized = true,
        p2_honour_approved = v_is_approved,
        p2_honour_xp_awarded = v_awarded_xp,
        p2_honour_penalty_applied = case when v_is_approved then 0 else v_unfair_penalty_xp end,
        status = case when v_other_finalized then 'finished' else status end
    where id = p_duel_id;
  end if;
end;
$$;

grant execute on function public.submit_community_honour_vote(uuid, text, boolean) to authenticated;
