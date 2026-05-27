import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { generateId } from './utils';
import { getLevelFromXp, getRankFromLevel, getXpProgress } from './xp';
import { applyReview, defaultSM2, isDue, RATING_XP, type Rating, type CardSM2, type MasteryState } from './sm2';
import { generateOrbHue } from './orb-color';
import { supabase } from './supabase';
import { type Session } from '@supabase/supabase-js';

const DUEL_INVITE_TTL_MS = 15 * 60 * 1000;
const DUEL_JOIN_TTL_MS = 2 * 60 * 1000;

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

export interface User {
  id: string;
  name: string;
  school?: string;
  orbHue?: number;
  onboardingCompleted?: boolean;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  plannedDuration: number;
  actualDuration: number;
  pauseCount: number;
  xpEarned: number;
  completedAt: string;
  isCompleted: boolean;
  noPauseChallenge: boolean;
}

export interface Deck {
  id: string;
  title: string;
  subject: string;
  description: string;
  tags: string[];
  color: string;
  createdAt: string;
  lastStudiedAt: string | null;
}

export interface Card extends CardSM2 {
  id: string;
  deckId: string;
  front: string;
  back: string;
  createdAt: string;
}

export interface DeckStudySession {
  id: string;
  deckId: string;
  cardsReviewed: number;
  xpEarned: number;
  accuracy: number;
  completedAt: string;
}

export type ArenaDifficulty = 'blitz' | 'standard' | 'marathon';

export interface ArenaSession {
  id: string;
  deckId: string;
  difficulty: ArenaDifficulty;
  totalCards: number;
  correctCount: number;
  wrongCount: number;
  avgResponseTime: number;
  bestStreak: number;
  xpEarned: number;
  completedAt: string;
}

export interface AppState {
  user: User | null;
  totalXp: number;
  streak: number;
  momentum: number;
  focusSessions: FocusSession[];
  decks: Deck[];
  cards: Card[];
  deckStudySessions: DeckStudySession[];
  arenaSessions: ArenaSession[];
  lastActiveDate: string | null;
}

// ═══════════════════════════════════════════════
// CONTEXT TYPE
// ═══════════════════════════════════════════════

interface AppContextType {
  state: AppState;
  isLoading: boolean;
  // User
  setUser: (user: User | null) => void;
  resetUser: () => void;
  deleteAccount: () => Promise<void>;
  // XP
  addXp: (amount: number) => Promise<{ newLevel: number; oldLevel: number; leveledUp: boolean; newRank: string; oldRank: string; rankChanged: boolean }>;
  getLevel: () => number;
  getRank: () => string;
  getXpProgress: () => { level: number; currentLevelXp: number; nextLevelXp: number; progress: number };
  // Focus
  addFocusSession: (session: Omit<FocusSession, 'id'>) => Promise<void>;
  getTodayFocusTime: () => number;
  getTodaySessionCount: () => number;
  getLongestSession: () => number;
  getFocusStreak: () => number;
  getWeeklyFocusData: () => { day: string; minutes: number }[];
  // Decks
  addDeck: (deck: Omit<Deck, 'id' | 'createdAt' | 'lastStudiedAt'>) => Promise<Deck>;
  updateDeck: (id: string, patch: Partial<Omit<Deck, 'id' | 'createdAt'>>) => Promise<void>;
  deleteDeck: (id: string) => Promise<void>;
  // Cards
  addCard: (card: Omit<Card, 'id' | 'createdAt' | keyof CardSM2>) => Promise<Card>;
  addCards: (cards: Omit<Card, 'id' | 'createdAt' | keyof CardSM2>[]) => Promise<Card[]>;
  updateCard: (id: string, patch: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  getDeckCards: (deckId: string) => Card[];
  getDueCards: (deckId: string) => Card[];
  getDeckStats: (deckId: string) => { total: number; due: number; mastery: number; masteryBreakdown: Record<MasteryState, number> };
  reviewCard: (cardId: string, rating: Rating) => number;
  // Deck sessions
  addDeckStudySession: (session: Omit<DeckStudySession, 'id'>) => Promise<void>;
  // Profile
  getTotalFocusTime: () => number;
  getTotalCardsStudied: () => number;
  getTotalCardsMastered: () => number;
  getStudyHeatmap: () => { date: string; minutes: number; sessions: number }[];
  getAchievements: () => { id: string; title: string; description: string; icon: string; unlocked: boolean }[];
  // Dashboard
  getTodayXp: () => number;
  getTodayDeckSessions: () => DeckStudySession[];
  getTodayCardsReviewed: () => number;
  getDailyMissions: () => { id: string; title: string; description: string; icon: string; current: number; target: number; done: boolean }[];
  getRecentActivity: () => { id: string; type: 'focus' | 'study' | 'arena'; title: string; subtitle: string; xp: number; timestamp: string }[];
  getAllDueCards: () => number;
  // Arenas
  addArenaSession: (session: Omit<ArenaSession, 'id'>) => Promise<void>;
  getArenaStats: () => { totalArenas: number; bestStreak: number; avgAccuracy: number; totalArenaXp: number };
  getDeckArenaHistory: (deckId: string) => ArenaSession[];
  
  // Orb Identity
  getOrbHue: () => number;
  rankUpTrigger: number;
  triggerRankUpCinematic: () => void;
  // UI Control
  isOrbHidden: boolean;
  setOrbHidden: (hidden: boolean) => void;

  // Social & Insights
  getWeeklyInsights: () => {
    thisWeekXp: number;
    lastWeekXp: number;
    bestDay: { day: string; minutes: number } | null;
    mostStudiedDeck: { title: string; sessions: number } | null;
    consistency: number;
  };
  getMilestones: () => { id: string; title: string; date: string; description: string; icon: string }[];
  // Social Extended
  searchUsers: (query: string) => Promise<{ id: string; name: string; username?: string; total_xp: number }[]>;
  isUsernameAvailable: (username: string) => Promise<boolean>;
  sendFriendRequest: (friendId: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  sendDuelInvite: (friendId: string, duelId: string, deckId?: string) => Promise<void>;
  acceptDuelInvite: (requestId: string) => Promise<string | null>;
  cancelDuel: (duelId: string) => Promise<boolean>;
  dismissNotification: (notification: any) => Promise<void>;
  getNotifications: () => Promise<any[]>;
  clearNotifications: () => Promise<void>;
  getFriends: () => Promise<{ friendshipId: string; id: string; name: string; status: string; total_xp: number; isIncoming: boolean }[]>;
  getLeaderboard: () => Promise<{ id: string; name: string; total_xp: number; rank: string }[]>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  getMessages: (otherId: string) => Promise<{ id: string; sender_id: string; content: string; created_at: string }[]>;
  markMessagesAsRead: (otherUserId: string) => Promise<void>;
  // Battle
  joinMatchmaking: (deckId: string) => Promise<void>;
  leaveMatchmaking: () => Promise<void>;
  getMatch: () => Promise<any>;
  createDuel: (mode: 'deck' | 'writing', targetUserId: string, deckId?: string, initialStatus?: 'invited' | 'setup') => Promise<string>;
  updateDuel: (duelId: string, updates: any) => Promise<boolean>;
  getDuel: (id: string) => Promise<any>;
  getPublicDuels: () => Promise<any[]>;
  submitCommunityHonourVote: (duel: any, targetPlayer: 'p1' | 'p2', isReasonable: boolean) => Promise<void>;
  // Auth
  session: Session | null;
  signOut: () => Promise<void>;
}

// ═══════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════

const STORAGE_KEY = 'levelup_state';

const defaultState: AppState = {
  user: null,
  totalXp: 0,
  streak: 0,
  momentum: 0,
  focusSessions: [],
  decks: [],
  cards: [],
  deckStudySessions: [],
  arenaSessions: [],
  lastActiveDate: null,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ensureUuid(id: string | undefined, remap: Map<string, string>): string {
  if (id && UUID_RE.test(id)) return id;
  if (id && remap.has(id)) return remap.get(id)!;
  const next = generateId();
  if (id) remap.set(id, next);
  return next;
}

function normalizePersistedState(state: AppState): AppState {
  const deckIdMap = new Map<string, string>();
  const cardIdMap = new Map<string, string>();

  const decks = state.decks.map(deck => ({
    ...deck,
    id: ensureUuid(deck.id, deckIdMap),
  }));

  const cards = state.cards.map(card => ({
    ...card,
    id: ensureUuid(card.id, cardIdMap),
    deckId: deckIdMap.get(card.deckId) || card.deckId,
  }));

  const deckStudySessions = state.deckStudySessions.map(session => ({
    ...session,
    deckId: deckIdMap.get(session.deckId) || session.deckId,
  }));

  const arenaSessions = state.arenaSessions.map(session => ({
    ...session,
    deckId: deckIdMap.get(session.deckId) || session.deckId,
  }));

  return { ...state, decks, cards, deckStudySessions, arenaSessions };
}

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return normalizePersistedState({ ...defaultState, ...JSON.parse(saved) });
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }

  // Cookie-backed fallback for iOS Safari / Private Tabs
  try {
    const name = "levelup_backup_user=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    let userVal = null;
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1);
      if (c.indexOf(name) === 0) {
        userVal = c.substring(name.length, c.length);
        break;
      }
    }
    if (userVal) {
      const parsedUser = JSON.parse(userVal);
      return { ...defaultState, user: parsedUser };
    }
  } catch (e) {
    console.error('Failed to load state cookie fallback:', e);
  }

  return defaultState;
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // Cookie backup for critical onboarding state
    if (state.user) {
      const d = new Date();
      d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
      const expires = "expires=" + d.toUTCString();
      document.cookie = `levelup_backup_user=${encodeURIComponent(JSON.stringify(state.user))};${expires};path=/;SameSite=Lax;Secure`;
    } else {
      document.cookie = "levelup_backup_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;SameSite=Lax;Secure";
    }
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

function mapDeckFromDb(row: any): Deck {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    description: row.description || '',
    tags: row.tags || [],
    color: row.color,
    createdAt: row.created_at || row.createdAt,
    lastStudiedAt: row.last_studied_at || row.lastStudiedAt || null,
  };
}

function mapCardFromDb(row: any): Card {
  return {
    id: row.id,
    deckId: row.deck_id || row.deckId,
    front: row.front,
    back: row.back,
    createdAt: row.created_at || row.createdAt,
    interval: row.interval,
    repetitions: row.repetitions,
    easeFactor: row.ease_factor || row.easeFactor,
    dueDate: row.due_date || row.dueDate,
    masteryState: row.mastery_state || row.masteryState,
    lastReviewedAt: row.last_reviewed_at || row.lastReviewedAt || null,
  };
}

function mapDeckPatchToDb(patch: Partial<Omit<Deck, 'id' | 'createdAt'>>) {
  const dbPatch: any = { ...patch };
  if (patch.lastStudiedAt !== undefined) dbPatch.last_studied_at = patch.lastStudiedAt;
  delete dbPatch.lastStudiedAt;
  return dbPatch;
}

function mapDeckToDb(deck: Deck, userId: string) {
  return {
    id: deck.id,
    user_id: userId,
    title: deck.title,
    subject: deck.subject,
    description: deck.description,
    color: deck.color,
    tags: deck.tags,
    created_at: deck.createdAt,
    last_studied_at: deck.lastStudiedAt,
  };
}

function mapCardToDb(card: Card, userId: string) {
  return {
    id: card.id,
    user_id: userId,
    deck_id: card.deckId,
    front: card.front,
    back: card.back,
    interval: card.interval,
    repetitions: card.repetitions,
    ease_factor: card.easeFactor,
    due_date: card.dueDate,
    mastery_state: card.masteryState,
    last_reviewed_at: card.lastReviewedAt,
    created_at: card.createdAt,
  };
}

function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return new Date(dateStr).toDateString() === yesterday.toDateString();
}

// ═══════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState());
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrbHidden, setOrbHidden] = useState(false);
  const [rankUpTrigger, setRankUpTrigger] = useState(0);

  const triggerRankUpCinematic = useCallback(() => {
    setRankUpTrigger(prev => prev + 1);
  }, []);
  const backfilledUserId = useRef<string | null>(null);

  useEffect(() => {
    // 1. Initial Auth Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      handleAuthChange(session);
    });

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      handleAuthChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = async (session: Session | null) => {
    if (!session) {
      setState(prev => {
        if (prev.user?.id === 'local-operator' || prev.user?.id === 'debug-user') {
          return prev;
        }
        return { ...prev, user: null };
      });
      setIsLoading(false);
      return;
    }

    try {
      // Fetch Profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // If no profile, create one (Initial Signup)
      if (!profile) {
        const orbHue = generateOrbHue(session.user.id);
        const newProfile = {
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Operator',
          total_xp: 0,
          streak: 0,
          momentum: 0,
          orb_hue: orbHue,
          created_at: new Date().toISOString(),
        };
        await supabase.from('profiles').insert(newProfile);
        
        setState(prev => ({
          ...prev,
          user: {
            id: newProfile.id,
            name: newProfile.name,
            orbHue,
            createdAt: newProfile.created_at,
          },
          totalXp: 0,
          streak: 0,
          momentum: 0,
        }));
      } else {
        // Fetch All Data
        const [decksRes, cardsRes, focusRes, studyRes, arenaRes] = await Promise.all([
          supabase.from('decks').select('*').eq('user_id', session.user.id),
          supabase.from('cards').select('*').eq('user_id', session.user.id),
          supabase.from('focus_sessions').select('*').eq('user_id', session.user.id),
          supabase.from('deck_study_sessions').select('*').eq('user_id', session.user.id),
          supabase.from('arena_sessions').select('*').eq('user_id', session.user.id),
        ]);

        const remoteDecks = (decksRes.data || []).map(mapDeckFromDb);
        const remoteCards = (cardsRes.data || []).map(mapCardFromDb);

        // Auto-generate orbHue for existing users who don't have one
        let orbHue = profile.orb_hue;
        if (orbHue == null) {
          orbHue = generateOrbHue(profile.id);
          supabase.from('profiles').update({ orb_hue: orbHue }).eq('id', profile.id).then(() => {});
        }

        // Self-healing Onboarding completed check: if user already has decks or cards, or their profile is older than 2 minutes, they completed onboarding!
        const createdTime = profile.created_at ? new Date(profile.created_at).getTime() : Date.now();
        const isExistingUser = (Date.now() - createdTime) > 2 * 60 * 1000; // 2 minutes
        
        let onboardingCompleted = profile.onboarding_completed || remoteDecks.length > 0 || remoteCards.length > 0 || isExistingUser;
        if (onboardingCompleted && !profile.onboarding_completed) {
          // Sync it back to the profile table in the background
          supabase.from('profiles').update({ onboarding_completed: true }).eq('id', profile.id).then(() => {});
        }

        // Persist previous user info for quick re-login experience
        if (session.user.email) {
          localStorage.setItem('orbis_previous_user', JSON.stringify({
            email: session.user.email,
            name: profile.name,
            username: profile.username || '',
            orbHue: orbHue
          }));
        }

        setState(prev => {
          const isSwitchingUsers = prev.user && 
                                   prev.user.id !== 'local-operator' && 
                                   prev.user.id !== 'debug-user' && 
                                   prev.user.id !== profile.id;
          
          const finalDecks = isSwitchingUsers
            ? remoteDecks
            : [...remoteDecks, ...prev.decks.filter(ld => !remoteDecks.find(sd => sd.id === ld.id))];

          const finalCards = isSwitchingUsers
            ? remoteCards
            : [...remoteCards, ...prev.cards.filter(lc => !remoteCards.find(sc => sc.id === lc.id))];

          return {
            ...prev,
            user: {
              id: profile.id,
              name: profile.name,
              school: profile.school,
              orbHue,
              onboardingCompleted: onboardingCompleted,
              createdAt: profile.created_at,
            },
            totalXp: profile.total_xp,
            streak: profile.streak,
            momentum: profile.momentum,
            focusSessions: focusRes.data || [],
            decks: finalDecks,
            cards: finalCards,
            deckStudySessions: studyRes.data || [],
            arenaSessions: arenaRes.data || [],
            lastActiveDate: profile.last_active_date,
          };
        });
      }
    } catch (err) {
      console.error('Error syncing with Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) saveState(state);
  }, [state, isLoading]);

  useEffect(() => {
    if (isLoading || !state.user || backfilledUserId.current === state.user.id) return;
    if (state.decks.length === 0 && state.cards.length === 0) return;

    const userId = state.user.id;
    backfilledUserId.current = userId;

    const performBackfill = async () => {
      try {
        const localDecks = [...state.decks];
        const localCards = [...state.cards];
        
        const deckIds = localDecks.map(d => d.id);
        const cardIds = localCards.map(c => c.id);

        const [existingDecksRes, existingCardsRes] = await Promise.all([
          deckIds.length > 0 ? supabase.from('decks').select('id, user_id').in('id', deckIds) : Promise.resolve({ data: [], error: null }),
          cardIds.length > 0 ? supabase.from('cards').select('id, user_id').in('id', cardIds) : Promise.resolve({ data: [], error: null })
        ]);

        if (existingDecksRes.error) {
          console.error("Error checking existing decks in Supabase:", existingDecksRes.error);
        }
        if (existingCardsRes.error) {
          console.error("Error checking existing cards in Supabase:", existingCardsRes.error);
        }

        const existingDecks = existingDecksRes.data || [];
        const existingCards = existingCardsRes.data || [];

        const deckIdRemap = new Map<string, string>();
        const cardIdRemap = new Map<string, string>();

        existingDecks.forEach(row => {
          if (row.user_id !== userId) {
            deckIdRemap.set(row.id, generateId());
          }
        });

        existingCards.forEach(row => {
          if (row.user_id !== userId) {
            cardIdRemap.set(row.id, generateId());
          }
        });

        let finalDecks = localDecks;
        let finalCards = localCards;

        if (deckIdRemap.size > 0 || cardIdRemap.size > 0) {
          finalDecks = localDecks.map(d => ({
            ...d,
            id: deckIdRemap.get(d.id) || d.id
          }));

          finalCards = localCards.map(c => ({
            ...c,
            id: cardIdRemap.get(c.id) || c.id,
            deckId: deckIdRemap.get(c.deckId) || c.deckId
          }));

          setState(prev => {
            const remappedDecks = prev.decks.map(d => ({
              ...d,
              id: deckIdRemap.get(d.id) || d.id
            }));
            const remappedCards = prev.cards.map(c => ({
              ...c,
              id: cardIdRemap.get(c.id) || c.id,
              deckId: deckIdRemap.get(c.deckId) || c.deckId
            }));
            const remappedStudy = prev.deckStudySessions.map(s => ({
              ...s,
              deckId: deckIdRemap.get(s.deckId) || s.deckId
            }));
            const remappedArena = prev.arenaSessions.map(a => ({
              ...a,
              deckId: deckIdRemap.get(a.deckId) || a.deckId
            }));

            return {
              ...prev,
              decks: remappedDecks,
              cards: remappedCards,
              deckStudySessions: remappedStudy,
              arenaSessions: remappedArena
            };
          });
        }

        const [decksRes, cardsRes] = await Promise.all([
          finalDecks.length > 0
            ? supabase.from('decks').upsert(finalDecks.map(deck => mapDeckToDb(deck, userId)))
            : Promise.resolve({ error: null }),
          finalCards.length > 0
            ? supabase.from('cards').upsert(finalCards.map(card => mapCardToDb(card, userId)))
            : Promise.resolve({ error: null })
        ]);

        if (decksRes.error) console.error("Failed to backfill local decks into Supabase:", decksRes.error);
        if (cardsRes.error) console.error("Failed to backfill local cards into Supabase:", cardsRes.error);

      } catch (err) {
        console.error("Failed executing resilient backfill sequence:", err);
      }
    };

    performBackfill();
  }, [isLoading, state.user, state.decks, state.cards]);

  // ── User ──────────────────────────────────────

  const setUser = useCallback((user: User | null) => {
    setState(prev => ({ ...prev, user }));
  }, []);

  const resetUser = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState(defaultState);
    setSession(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!state.user) return;
    try {
      const userId = state.user.id;
      
      // Delete user dependent tables
      await supabase.from('cards').delete().eq('user_id', userId);
      await supabase.from('decks').delete().eq('user_id', userId);
      await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      await supabase.from('duels').delete().or(`player1_id.eq.${userId},player2_id.eq.${userId}`);
      await supabase.from('friends').delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`);
      await supabase.from('profiles').delete().eq('id', userId);
      
      // Clean local storage and sign out
      await signOut();
    } catch (err) {
      console.error("[store] Failed to delete user account data:", err);
      throw err;
    }
  }, [state.user, signOut]);

  // ── XP ───────────────────────────────────────

  const addXp = useCallback(async (amount: number) => {
    const oldLevel = getLevelFromXp(state.totalXp);
    const oldRank = getRankFromLevel(oldLevel);
    const newTotalXp = state.totalXp + amount;
    const newLevel = getLevelFromXp(newTotalXp);
    const newRank = getRankFromLevel(newLevel);
    const result = { oldLevel, newLevel, leveledUp: newLevel > oldLevel, oldRank, newRank, rankChanged: newRank !== oldRank };

    if (!state.user) return result;

    const today = new Date().toISOString();
    let newStreak = state.streak;
    let newMomentum = state.momentum;
    if (!state.lastActiveDate || !isToday(state.lastActiveDate)) {
      newStreak = state.lastActiveDate && isYesterday(state.lastActiveDate) ? state.streak + 1 : 1;
      newMomentum = Math.min(state.momentum + 1, 10);
    }

    // Update State
    setState(prev => ({ ...prev, totalXp: newTotalXp, streak: newStreak, momentum: newMomentum, lastActiveDate: today }));

    // Sync with Supabase
    await supabase.from('profiles').update({
      total_xp: newTotalXp,
      streak: newStreak,
      momentum: newMomentum,
      last_active_date: today
    }).eq('id', state.user.id);

    return result;
  }, [state.totalXp, state.streak, state.momentum, state.lastActiveDate, state.user]);

  const getLevel = useCallback(() => getLevelFromXp(state.totalXp), [state.totalXp]);
  const getRank = useCallback(() => getRankFromLevel(getLevelFromXp(state.totalXp)), [state.totalXp]);
  const getXpProgressData = useCallback(() => getXpProgress(state.totalXp), [state.totalXp]);

  // ── Orb Identity ──────────────────────────────
  const getOrbHue = useCallback(() => {
    if (state.user?.orbHue != null) return state.user.orbHue;
    if (state.user?.id) return generateOrbHue(state.user.id);
    return 200; // Default cyan-ish hue as fallback
  }, [state.user?.orbHue, state.user?.id]);

  // ── Focus ─────────────────────────────────────

  const addFocusSession = useCallback(async (session: Omit<FocusSession, 'id'>) => {
    if (!state.user) return;
    const newSession = { ...session, id: generateId() };
    setState(prev => ({
      ...prev,
      focusSessions: [newSession, ...prev.focusSessions].slice(0, 200),
    }));

    await supabase.from('focus_sessions').insert({
      id: newSession.id,
      user_id: state.user.id,
      planned_duration: newSession.plannedDuration,
      actual_duration: newSession.actualDuration,
      pause_count: newSession.pauseCount,
      xp_earned: newSession.xpEarned,
      no_pause_challenge: newSession.noPauseChallenge,
      is_completed: newSession.isCompleted,
      completed_at: newSession.completedAt
    });
  }, [state.user]);

  const getTodayFocusTime = useCallback(() =>
    state.focusSessions.filter(s => isToday(s.completedAt)).reduce((sum, s) => sum + s.actualDuration, 0),
    [state.focusSessions]);

  const getTodaySessionCount = useCallback(() =>
    state.focusSessions.filter(s => isToday(s.completedAt)).length,
    [state.focusSessions]);

  const getLongestSession = useCallback(() =>
    state.focusSessions.length === 0 ? 0 : Math.max(...state.focusSessions.map(s => s.actualDuration)),
    [state.focusSessions]);

  const getFocusStreak = useCallback(() => {
    const sessions = [...state.focusSessions].sort((a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    if (sessions.length === 0) return 0;
    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dayStr = checkDate.toDateString();
      const has = sessions.some(s => new Date(s.completedAt).toDateString() === dayStr && s.actualDuration >= 1500);
      if (has) streak++;
      else if (i > 0) break;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }, [state.focusSessions]);

  const getWeeklyFocusData = useCallback(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayStr = date.toDateString();
      const totalSec = state.focusSessions
        .filter(s => new Date(s.completedAt).toDateString() === dayStr)
        .reduce((sum, s) => sum + s.actualDuration, 0);
      return { day: days[date.getDay()], minutes: Math.round(totalSec / 60) };
    });
  }, [state.focusSessions]);

  // ── Decks ─────────────────────────────────────

  const addDeck = useCallback(async (deck: Omit<Deck, 'id' | 'createdAt' | 'lastStudiedAt'>) => {
    if (!state.user) return null as any;
    const newDeck: Deck = { ...deck, id: generateId(), createdAt: new Date().toISOString(), lastStudiedAt: null };
    
    setState(prev => ({ ...prev, decks: [newDeck, ...prev.decks] }));
    
    const { error } = await supabase.from('decks').insert({
      id: newDeck.id,
      user_id: state.user.id,
      title: newDeck.title,
      subject: newDeck.subject,
      description: newDeck.description,
      color: newDeck.color,
      tags: newDeck.tags,
      created_at: newDeck.createdAt
    });

    if (error) {
      console.error("Failed to insert deck into Supabase:", error);
    }

    return newDeck;
  }, [state.user]);

  const updateDeck = useCallback(async (id: string, patch: Partial<Omit<Deck, 'id' | 'createdAt'>>) => {
    setState(prev => ({
      ...prev,
      decks: prev.decks.map(d => d.id === id ? { ...d, ...patch } : d),
    }));

    const { error } = await supabase.from('decks').update(mapDeckPatchToDb(patch)).eq('id', id);
    if (error) {
      console.error("Failed to update deck in Supabase:", error);
    }
  }, []);

  const deleteDeck = useCallback(async (id: string) => {
    setState(prev => ({
      ...prev,
      decks: prev.decks.filter(d => d.id !== id),
      cards: prev.cards.filter(c => c.deckId !== id),
    }));

    await Promise.all([
      supabase.from('decks').delete().eq('id', id),
      supabase.from('cards').delete().eq('deck_id', id)
    ]);
  }, []);

  // ── Cards ─────────────────────────────────────

  const addCard = useCallback(async (card: Omit<Card, 'id' | 'createdAt' | keyof CardSM2>) => {
    if (!state.user) return null as any;
    const newCard: Card = {
      ...card,
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...defaultSM2(),
    };
    setState(prev => ({ ...prev, cards: [...prev.cards, newCard] }));

    const { error } = await supabase.from('cards').insert({
      id: newCard.id,
      user_id: state.user.id,
      deck_id: newCard.deckId,
      front: newCard.front,
      back: newCard.back,
      interval: newCard.interval,
      repetitions: newCard.repetitions,
      ease_factor: newCard.easeFactor,
      due_date: newCard.dueDate,
      mastery_state: newCard.masteryState,
      created_at: newCard.createdAt
    });

    if (error) {
      console.error("Failed to insert card into Supabase:", error);
    }

    return newCard;
  }, [state.user]);

  const addCards = useCallback(async (cards: Omit<Card, 'id' | 'createdAt' | keyof CardSM2>[]) => {
    const newCards: Card[] = cards.map(c => ({
      ...c,
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...defaultSM2(),
    }));
    setState(prev => ({ ...prev, cards: [...prev.cards, ...newCards] }));
    if (state.user && newCards.length > 0) {
      const { error } = await supabase.from('cards').insert(newCards.map(card => ({
        id: card.id,
        user_id: state.user!.id,
        deck_id: card.deckId,
        front: card.front,
        back: card.back,
        interval: card.interval,
        repetitions: card.repetitions,
        ease_factor: card.easeFactor,
        due_date: card.dueDate,
        mastery_state: card.masteryState,
        created_at: card.createdAt
      })));
      if (error) {
        console.error("Failed to bulk insert cards into Supabase:", error);
      }
    }
    return newCards;
  }, [state.user]);

  const updateCard = useCallback(async (id: string, patch: Partial<Card>) => {
    setState(prev => ({
      ...prev,
      cards: prev.cards.map(c => c.id === id ? { ...c, ...patch } : c),
    }));

    // Map camelCase to snake_case if needed
    const dbPatch: any = { ...patch };
    if (patch.dueDate) dbPatch.due_date = patch.dueDate;
    if (patch.easeFactor) dbPatch.ease_factor = patch.easeFactor;
    if (patch.masteryState) dbPatch.mastery_state = patch.masteryState;
    delete dbPatch.dueDate;
    delete dbPatch.easeFactor;
    delete dbPatch.masteryState;

    await supabase.from('cards').update(dbPatch).eq('id', id);
  }, []);

  const deleteCard = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, cards: prev.cards.filter(c => c.id !== id) }));
    await supabase.from('cards').delete().eq('id', id);
  }, []);

  const getDeckCards = useCallback((deckId: string) =>
    state.cards.filter(c => c.deckId === deckId),
    [state.cards]);

  const getDueCards = useCallback((deckId: string) =>
    state.cards.filter(c => c.deckId === deckId && isDue(c)),
    [state.cards]);

  const getDeckStats = useCallback((deckId: string) => {
    const cards = state.cards.filter(c => c.deckId === deckId);
    const total = cards.length;
    const due = cards.filter(c => isDue(c)).length;
    const masteryBreakdown: Record<MasteryState, number> = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
    cards.forEach(c => masteryBreakdown[c.masteryState]++);
    const mastery = total === 0 ? 0 : Math.round((masteryBreakdown.mastered / total) * 100);
    return { total, due, mastery, masteryBreakdown };
  }, [state.cards]);

  const reviewCard = useCallback((cardId: string, rating: Rating) => {
    const xp = RATING_XP[rating];
    setState(prev => ({
      ...prev,
      cards: prev.cards.map(c => {
        if (c.id !== cardId) return c;
        const sm2Result = applyReview(c, rating);
        return { ...c, ...sm2Result };
      }),
    }));
    return xp;
  }, []);

  // ── Deck Study Sessions ───────────────────────

  const addDeckStudySession = useCallback(async (session: Omit<DeckStudySession, 'id'>) => {
    if (!state.user) return;
    const newSession = { ...session, id: generateId() };
    
    setState(prev => ({
      ...prev,
      decks: prev.decks.map(d =>
        d.id === session.deckId ? { ...d, lastStudiedAt: session.completedAt } : d
      ),
      deckStudySessions: [newSession, ...prev.deckStudySessions].slice(0, 500),
    }));

    await Promise.all([
      supabase.from('deck_study_sessions').insert({
        id: newSession.id,
        user_id: state.user.id,
        deck_id: newSession.deckId,
        cards_reviewed: newSession.cardsReviewed,
        xp_earned: newSession.xpEarned,
        accuracy: newSession.accuracy,
        completed_at: newSession.completedAt
      }),
      supabase.from('decks').update({ last_studied_at: session.completedAt }).eq('id', session.deckId)
    ]);
  }, [state.user]);

  // ── Profile Analytics ─────────────────────────

  const getTotalFocusTime = useCallback(() =>
    state.focusSessions.reduce((sum, s) => sum + s.actualDuration, 0),
    [state.focusSessions]);

  const getTotalCardsStudied = useCallback(() =>
    state.cards.filter(c => c.masteryState !== 'new').length,
    [state.cards]);

  const getTotalCardsMastered = useCallback(() =>
    state.cards.filter(c => c.masteryState === 'mastered').length,
    [state.cards]);

  const getStudyHeatmap = useCallback(() => {
    const days: { date: string; minutes: number; sessions: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const dateStr = d.toISOString().split('T')[0];
      const focusMin = state.focusSessions
        .filter(s => new Date(s.completedAt).toDateString() === dayStr)
        .reduce((sum, s) => sum + s.actualDuration, 0) / 60;
      const deckSessions = state.deckStudySessions
        .filter(s => new Date(s.completedAt).toDateString() === dayStr).length;
      const focusSess = state.focusSessions
        .filter(s => new Date(s.completedAt).toDateString() === dayStr).length;
      days.push({ date: dateStr, minutes: Math.round(focusMin), sessions: focusSess + deckSessions });
    }
    return days;
  }, [state.focusSessions, state.deckStudySessions]);

  const getAchievements = useCallback(() => {
    const totalFocus = state.focusSessions.reduce((s, f) => s + f.actualDuration, 0);
    const longestSess = state.focusSessions.length > 0 ? Math.max(...state.focusSessions.map(s => s.actualDuration)) : 0;
    const hasNoPause = state.focusSessions.some(s => s.noPauseChallenge && s.pauseCount === 0 && s.isCompleted);
    const masteredCards = state.cards.filter(c => c.masteryState === 'mastered').length;
    const level = getLevelFromXp(state.totalXp);

    return [
      { id: 'first_focus', title: 'First Focus', description: 'Complete your first focus session', icon: '⏱', unlocked: state.focusSessions.length > 0 },
      { id: 'deck_creator', title: 'Deck Creator', description: 'Create your first deck', icon: '📚', unlocked: state.decks.length > 0 },
      { id: 'card_scholar', title: 'Card Scholar', description: 'Master 10 cards', icon: '🎓', unlocked: masteredCards >= 10 },
      { id: 'focus_warrior', title: 'Focus Warrior', description: 'Reach a 3-day streak', icon: '🔥', unlocked: state.streak >= 3 },
      { id: 'marathon', title: 'Marathon', description: 'Complete a 60+ minute session', icon: '🏃', unlocked: longestSess >= 3600 },
      { id: 'no_pause', title: 'No-Pause Legend', description: 'Complete a no-pause challenge', icon: '🛡', unlocked: hasNoPause },
      { id: 'centurion', title: 'Centurion', description: 'Reach Level 10', icon: '⚔', unlocked: level >= 10 },
      { id: 'vault', title: 'Knowledge Vault', description: 'Create 50+ flashcards', icon: '🏛', unlocked: state.cards.length >= 50 },
    ];
  }, [state.focusSessions, state.decks, state.cards, state.streak, state.totalXp]);

  // ── Dashboard Analytics ───────────────────────

  const getTodayXp = useCallback(() => {
    const focusXp = state.focusSessions
      .filter(s => isToday(s.completedAt))
      .reduce((sum, s) => sum + s.xpEarned, 0);
    const deckXp = state.deckStudySessions
      .filter(s => isToday(s.completedAt))
      .reduce((sum, s) => sum + s.xpEarned, 0);
    return focusXp + deckXp;
  }, [state.focusSessions, state.deckStudySessions]);

  const getTodayDeckSessions = useCallback(() =>
    state.deckStudySessions.filter(s => isToday(s.completedAt)),
    [state.deckStudySessions]);

  const getTodayCardsReviewed = useCallback(() =>
    state.deckStudySessions
      .filter(s => isToday(s.completedAt))
      .reduce((sum, s) => sum + s.cardsReviewed, 0),
    [state.deckStudySessions]);

  const getAllDueCards = useCallback(() =>
    state.cards.filter(c => isDue(c)).length,
    [state.cards]);

  const getDailyMissions = useCallback(() => {
    const level = getLevelFromXp(state.totalXp);
    const focusTarget = Math.min(15 + level * 2, 90); // minutes
    const todayFocusMin = Math.round(state.focusSessions
      .filter(s => isToday(s.completedAt))
      .reduce((sum, s) => sum + s.actualDuration, 0) / 60);

    const dueCount = state.cards.filter(c => isDue(c)).length;
    const cardTarget = Math.min(Math.max(dueCount, 5), 20);
    const todayCards = state.deckStudySessions
      .filter(s => isToday(s.completedAt))
      .reduce((sum, s) => sum + s.cardsReviewed, 0);

    const todaySessions = state.focusSessions.filter(s => isToday(s.completedAt)).length
      + state.deckStudySessions.filter(s => isToday(s.completedAt)).length;

    const missions = [
      {
        id: 'focus_daily',
        title: `Focus for ${focusTarget} min`,
        description: 'Complete focused study time',
        icon: '⏱',
        current: Math.min(todayFocusMin, focusTarget),
        target: focusTarget,
        done: todayFocusMin >= focusTarget,
      },
      {
        id: 'review_cards',
        title: `Review ${cardTarget} cards`,
        description: dueCount > 0 ? `${dueCount} cards due` : 'Study your decks',
        icon: '🃏',
        current: Math.min(todayCards, cardTarget),
        target: cardTarget,
        done: todayCards >= cardTarget,
      },
      {
        id: 'session_count',
        title: 'Complete 3 sessions',
        description: 'Any focus or study session',
        icon: '🏆',
        current: Math.min(todaySessions, 3),
        target: 3,
        done: todaySessions >= 3,
      },
    ];
    return missions;
  }, [state.totalXp, state.focusSessions, state.deckStudySessions, state.cards]);

  const getRecentActivity = useCallback(() => {
    const focusEvents = state.focusSessions.slice(0, 10).map(s => ({
      id: s.id,
      type: 'focus' as const,
      title: s.isCompleted ? 'Focus Session Complete' : 'Focus Session',
      subtitle: `${Math.round(s.actualDuration / 60)} min${s.noPauseChallenge && s.pauseCount === 0 ? ' · No-Pause ✓' : ''}`,
      xp: s.xpEarned,
      timestamp: s.completedAt,
    }));
    const deckEvents = state.deckStudySessions.slice(0, 10).map(s => {
      const deck = state.decks.find(d => d.id === s.deckId);
      return {
        id: s.id,
        type: 'study' as const,
        title: deck ? `Studied ${deck.title}` : 'Deck Study',
        subtitle: `${s.cardsReviewed} cards · ${s.accuracy}% accuracy`,
        xp: s.xpEarned,
        timestamp: s.completedAt,
      };
    });
    const arenaEvents = state.arenaSessions.slice(0, 10).map(s => {
      const deck = state.decks.find(d => d.id === s.deckId);
      return {
        id: s.id,
        type: 'arena' as const,
        title: deck ? `Arena: ${deck.title}` : 'Arena Challenge',
        subtitle: `${s.correctCount}/${s.totalCards} correct · ${s.difficulty}`,
        xp: s.xpEarned,
        timestamp: s.completedAt,
      };
    });
    return [...focusEvents, ...deckEvents, ...arenaEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [state.focusSessions, state.deckStudySessions, state.arenaSessions, state.decks]);

  // ── Arenas ────────────────────────────────────

  const addArenaSession = useCallback(async (session: Omit<ArenaSession, 'id'>) => {
    if (!state.user) return;
    const newSession = { ...session, id: generateId() };
    
    setState(prev => ({
      ...prev,
      arenaSessions: [newSession, ...prev.arenaSessions].slice(0, 500),
    }));

    await supabase.from('arena_sessions').insert({
      id: newSession.id,
      user_id: state.user.id,
      deck_id: newSession.deckId,
      difficulty: newSession.difficulty,
      total_cards: newSession.totalCards,
      correct_count: newSession.correctCount,
      wrong_count: newSession.wrongCount,
      avg_response_time: newSession.avgResponseTime,
      best_streak: newSession.bestStreak,
      xp_earned: newSession.xpEarned,
      completed_at: newSession.completedAt
    });
  }, [state.user]);

  const getArenaStats = useCallback(() => {
    const sessions = state.arenaSessions;
    const totalArenas = sessions.length;
    const bestStreak = sessions.length > 0 ? Math.max(...sessions.map(s => s.bestStreak)) : 0;
    const avgAccuracy = totalArenas > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.correctCount / s.totalCards) * 100, 0) / totalArenas)
      : 0;
    const totalArenaXp = sessions.reduce((sum, s) => sum + s.xpEarned, 0);
    return { totalArenas, bestStreak, avgAccuracy, totalArenaXp };
  }, [state.arenaSessions]);

  const getDeckArenaHistory = useCallback((deckId: string) =>
    state.arenaSessions.filter(s => s.deckId === deckId),
    [state.arenaSessions]);

  // ── Social & Insights ─────────────────────────

  const getWeeklyInsights = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
    // Let's assume week starts on Monday
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - daysSinceMonday);
    
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    let thisWeekXp = 0;
    let lastWeekXp = 0;

    const allSessions = [
      ...state.focusSessions.map(s => ({ date: new Date(s.completedAt), xp: s.xpEarned, min: s.actualDuration / 60 })),
      ...state.deckStudySessions.map(s => ({ date: new Date(s.completedAt), xp: s.xpEarned, min: 0 })),
      ...state.arenaSessions.map(s => ({ date: new Date(s.completedAt), xp: s.xpEarned, min: 0 }))
    ];

    const thisWeekDays = new Set<string>();

    const dayMinutes: Record<string, number> = {};
    const deckSessionsCount: Record<string, number> = {};

    allSessions.forEach(s => {
      if (s.date >= startOfThisWeek) {
        thisWeekXp += s.xp;
        thisWeekDays.add(s.date.toDateString());
        const dayStr = s.date.toLocaleDateString('en-US', { weekday: 'long' });
        dayMinutes[dayStr] = (dayMinutes[dayStr] || 0) + s.min;
      } else if (s.date >= startOfLastWeek && s.date < startOfThisWeek) {
        lastWeekXp += s.xp;
      }
    });

    state.deckStudySessions.forEach(s => {
      const d = new Date(s.completedAt);
      if (d >= startOfThisWeek) {
        deckSessionsCount[s.deckId] = (deckSessionsCount[s.deckId] || 0) + 1;
      }
    });

    let bestDay = null;
    let maxMin = 0;
    for (const [day, min] of Object.entries(dayMinutes)) {
      if (min > maxMin) { maxMin = min; bestDay = { day, minutes: Math.round(min) }; }
    }

    let mostStudiedDeck = null;
    let maxSess = 0;
    for (const [deckId, sess] of Object.entries(deckSessionsCount)) {
      if (sess > maxSess) {
        maxSess = sess;
        const deck = state.decks.find(d => d.id === deckId);
        if (deck) mostStudiedDeck = { title: deck.title, sessions: sess };
      }
    }

    const consistency = Math.round((thisWeekDays.size / 7) * 100);

    return { thisWeekXp, lastWeekXp, bestDay, mostStudiedDeck, consistency };
  }, [state.focusSessions, state.deckStudySessions, state.arenaSessions, state.decks]);

  const getMilestones = useCallback(() => {
    const milestones: { id: string; title: string; date: string; description: string; icon: string }[] = [];
    
    if (state.user) {
      milestones.push({
        id: 'account_created',
        title: 'Journey Began',
        date: new Date(state.user.createdAt).toISOString(),
        description: 'You joined the system.',
        icon: '🌟'
      });
    }

    if (state.focusSessions.length > 0) {
      const first = state.focusSessions[state.focusSessions.length - 1]; // assuming reverse chronological if un-sorted, wait, we prepend, so last is first
      // wait, let's sort them all chronologically first
      const sortedFocus = [...state.focusSessions].sort((a,b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
      if (sortedFocus.length > 0) {
        milestones.push({
          id: 'first_focus',
          title: 'First Focus Session',
          date: sortedFocus[0].completedAt,
          description: `Focused for ${Math.round(sortedFocus[0].actualDuration / 60)} minutes.`,
          icon: '⏱'
        });
      }
    }

    if (state.decks.length > 0) {
      const sortedDecks = [...state.decks].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      milestones.push({
        id: 'first_deck',
        title: 'First Deck Created',
        date: sortedDecks[0].createdAt,
        description: `Created "${sortedDecks[0].title}".`,
        icon: '📚'
      });
    }

    if (state.arenaSessions.length > 0) {
      const sortedArenas = [...state.arenaSessions].sort((a,b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
      milestones.push({
        id: 'first_arena',
        title: 'First Arena',
        date: sortedArenas[0].completedAt,
        description: `Survived ${sortedArenas[0].difficulty} mode.`,
        icon: '⚔'
      });
    }

    // Rank milestones
    const level = getLevelFromXp(state.totalXp);
    if (level >= 5) milestones.push({ id: 'lvl5', title: 'Level 5 Reached', date: new Date().toISOString(), description: 'Solid foundation.', icon: '🏆' });
    if (level >= 10) milestones.push({ id: 'lvl10', title: 'Level 10 Reached', date: new Date().toISOString(), description: 'Centurion!', icon: '🏆' });
    if (level >= 25) milestones.push({ id: 'lvl25', title: 'Level 25 Reached', date: new Date().toISOString(), description: 'Quarter century.', icon: '🏆' });

    if (state.streak >= 3) milestones.push({ id: 'streak3', title: '3-Day Streak', date: new Date().toISOString(), description: 'Building the habit.', icon: '🔥' });
    if (state.streak >= 7) milestones.push({ id: 'streak7', title: '7-Day Streak', date: new Date().toISOString(), description: 'One full week of focus.', icon: '🔥' });

    return milestones.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.user, state.focusSessions, state.decks, state.arenaSessions, state.totalXp, state.streak]);

  // ── Social & Competitive ─────────────────────

  const searchUsers = useCallback(async (query: string) => {
    if (!state.user || query.length < 2) return [];
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, total_xp, orb_hue')
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10);
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Search failed:", err);
      return [];
    }
  }, [state.user]);

  const isUsernameAvailable = useCallback(async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (error) return true;
      return !data;
    } catch {
      return true;
    }
  }, []);

  const sendFriendRequest = useCallback(async (friendId: string) => {
    if (!state.user) return;
    try {
      // Avoid creating duplicate friend requests/friendships
      const { data: existing } = await supabase
        .from('friends')
        .select('id')
        .or(`and(user_id.eq.${state.user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${state.user.id})`)
        .limit(1)
        .maybeSingle();

      if (existing) {
        console.log("[store] Friendship record already exists, skipping insertion.");
        return;
      }

      const { error } = await supabase.from('friends').insert({
        user_id: state.user.id,
        friend_id: friendId,
        status: 'pending'
      });
      if (error) throw error;
    } catch (err) {
      console.error("Friend request failed:", err);
    }
  }, [state.user]);

  const sendDuelInvite = useCallback(async (friendId: string, duelId: string, deckId?: string) => {
    if (!state.user) return;
    try {
      const { error } = await supabase.from('duel_requests').insert({
        sender_id: state.user.id,
        receiver_id: friendId,
        duel_id: duelId, // Trying to use duel_id column
        deck_id: deckId || null,
        status: 'pending'
      });
      if (error) {
        console.error("Duel invite insert failed:", error.message);
        // Fallback: Try without duel_id if it doesn't exist
        if (error.message.includes("column \"duel_id\" does not exist")) {
           const { error: error2 } = await supabase.from('duel_requests').insert({
             sender_id: state.user.id,
             receiver_id: friendId,
             deck_id: deckId || null,
             status: 'pending'
           });
           if (error2) throw error2;
        } else {
          throw error;
        }
      }
    } catch (err: any) {
      console.error("Duel invite failed:", err);
      alert("Combat Link Broadcast Failed: " + err.message);
    }
  }, [state.user]);

  const cancelDuel = useCallback(async (duelId: string) => {
    if (!state.user) return false;
    try {
      const { error } = await supabase
        .from('duels')
        .update({ status: 'cancelled' })
        .eq('id', duelId)
        .eq('player1_id', state.user.id);
      if (error) throw error;

      const { error: requestError } = await supabase
        .from('duel_requests')
        .update({ status: 'withdrawn' })
        .eq('duel_id', duelId)
        .eq('sender_id', state.user.id)
        .eq('status', 'pending');
      if (requestError && !requestError.message.includes('duel_id')) {
        throw requestError;
      }

      return true;
    } catch (err) {
      console.error("Cancel duel failed:", err);
      return false;
    }
  }, [state.user]);

  const acceptDuelInvite = useCallback(async (duelId: string) => {
    if (!state.user) return null;
    try {
      const { data: invite, error: inviteErr } = await supabase
        .from('duels')
        .select('id, status, created_at, player2_id')
        .eq('id', duelId)
        .maybeSingle();

      if (inviteErr) throw inviteErr;
      if (!invite || invite.player2_id !== state.user.id) return null;

      if (invite.status !== 'invited') {
        return invite.status === 'setup' ? invite.id : null;
      }

      const createdTime = new Date(invite.created_at).getTime();
      if (Number.isFinite(createdTime) && Date.now() - createdTime > DUEL_INVITE_TTL_MS) {
        await supabase
          .from('duels')
          .update({ status: 'declined' })
          .eq('id', duelId)
          .eq('status', 'invited');
        return null;
      }

      const { data: duel, error: duelErr } = await supabase
        .from('duels')
        .update({ status: 'setup', updated_at: new Date().toISOString() })
        .eq('id', duelId)
        .eq('player2_id', state.user.id)
        .eq('status', 'invited')
        .select()
        .single();

      if (duelErr) throw duelErr;
      
      if (duel && duel.player1_id) {
        // Send a message to the chat so the sender can join
        await supabase.from('messages').insert({
          sender_id: state.user.id,
          receiver_id: duel.player1_id,
          content: `levelup:duel_accepted:${duel.id}`
        });
      }
      
      return duel.id;
    } catch (err) {
      console.error("Accept duel failed:", err);
      return null;
    }
  }, [state.user]);

  const getNotifications = useCallback(async () => {
    if (!state.user) return [];
    try {
      const { data: friendReqsRaw } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', state.user.id)
        .eq('status', 'pending');

      const inviteCutoff = new Date(Date.now() - DUEL_INVITE_TTL_MS).toISOString();
      const joinCutoff = new Date(Date.now() - DUEL_JOIN_TTL_MS).toISOString();

      const { data: duelReqsRaw } = await supabase
        .from('duels')
        .select('*')
        .eq('player2_id', state.user.id)
        .eq('status', 'invited')
        .gte('created_at', inviteCutoff);

      const { data: readyDuelsRaw } = await supabase
        .from('duels')
        .select('*')
        .eq('player1_id', state.user.id)
        .eq('status', 'setup')
        .gte('updated_at', joinCutoff);

      const { data: cancelledDuelsRaw } = await supabase
        .from('duels')
        .select('*')
        .eq('player2_id', state.user.id)
        .eq('status', 'cancelled')
        .limit(10);

      // Fetch profiles for all unique sender IDs
      const senderIds = Array.from(new Set([
        ...(friendReqsRaw || []).map(r => r.user_id),
        ...(duelReqsRaw || []).map(r => r.player1_id),
        ...(readyDuelsRaw || []).map(r => r.player2_id),
        ...(cancelledDuelsRaw || []).map(r => r.player1_id)
      ]));

      const { data: senderProfiles } = senderIds.length > 0 
        ? await supabase.from('profiles').select('id, name, username, orb_hue').in('id', senderIds)
        : { data: [] };

      const notifications = [
        ...(friendReqsRaw || []).map(r => {
          const profile = (senderProfiles || []).find(p => p.id === r.user_id);
          return {
            id: r.id,
            type: 'friend',
            sender_id: r.user_id,
            sender: profile?.name || 'Unknown',
            username: profile?.username || 'unknown',
            orb_hue: profile?.orb_hue || 200,
            timestamp: r.created_at
          };
        }),
        ...(duelReqsRaw || []).map(r => {
          const profile = (senderProfiles || []).find(p => p.id === r.player1_id);
          return {
            id: r.id,
            type: 'duel',
            sender_id: r.player1_id,
            sender: profile?.name || 'Unknown',
            username: profile?.username || 'unknown',
            message: 'requested to duel',
            duel_id: r.id,
            timestamp: r.created_at
          };
        }),
        ...(readyDuelsRaw || []).map(r => {
          const profile = (senderProfiles || []).find(p => p.id === r.player2_id);
          return {
            id: `${r.id}:ready`,
            type: 'duel_ready',
            sender_id: r.player2_id,
            sender: profile?.name || 'Unknown',
            username: profile?.username || 'unknown',
            message: 'accepted your duel',
            duel_id: r.id,
            timestamp: r.updated_at || r.created_at
          };
        }),
        ...(cancelledDuelsRaw || []).map(r => {
          const profile = (senderProfiles || []).find(p => p.id === r.player1_id);
          return {
            id: `${r.id}:cancelled`,
            type: 'duel_cancelled',
            sender_id: r.player1_id,
            sender: profile?.name || 'Unknown',
            username: profile?.username || 'unknown',
            message: 'withdrew their duel challenge',
            duel_id: r.id,
            mode: r.mode || 'writing',
            timestamp: r.updated_at || r.created_at
          };
        })
      ];
      
      return notifications
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.error("Fetch notifications failed:", err);
      return [];
    }
  }, [state.user]);

  const dismissNotification = useCallback(async (notification: any) => {
    if (!state.user) return;
    try {
      if (notification.type === 'friend') {
        await supabase
          .from('friends')
          .update({ status: 'declined' })
          .eq('id', notification.id)
          .eq('friend_id', state.user.id);
      } else if (notification.type === 'duel') {
        await supabase
          .from('duels')
          .update({ status: 'declined' })
          .eq('id', notification.duel_id || notification.id)
          .eq('player2_id', state.user.id)
          .eq('status', 'invited');
      } else if (notification.type === 'duel_cancelled') {
        await supabase
          .from('duels')
          .update({ status: 'declined' })
          .eq('id', notification.duel_id || notification.id.replace(':cancelled', ''))
          .eq('player2_id', state.user.id)
          .eq('status', 'cancelled');
      } else if (notification.type === 'duel_ready') {
        await supabase
          .from('duels')
          .update({ status: 'declined' })
          .eq('id', notification.duel_id || notification.id.replace(':ready', ''))
          .eq('player1_id', state.user.id)
          .eq('status', 'setup');
      }
    } catch (err) {
      console.error("Dismiss notification failed:", err);
    }
  }, [state.user]);

  const clearNotifications = useCallback(async () => {
    if (!state.user) return;
    try {
      const results = await Promise.allSettled([
        supabase.from('friends').update({ status: 'declined' }).eq('friend_id', state.user.id).eq('status', 'pending'),
        supabase.from('duel_requests').update({ status: 'declined' }).eq('receiver_id', state.user.id).eq('status', 'pending'),
        supabase.from('duels').update({ status: 'declined' }).eq('player2_id', state.user.id).eq('status', 'invited'),
        supabase.from('duels').update({ status: 'declined' }).eq('player1_id', state.user.id).eq('status', 'setup'),
        supabase.from('duels').update({ status: 'declined' }).eq('player2_id', state.user.id).eq('status', 'cancelled')
      ]);

      results.forEach((result) => {
        if (result.status === 'rejected') {
          console.error("Clear notification request failed:", result.reason);
        } else if (result.value.error) {
          console.error("Clear notification update failed:", result.value.error);
        }
      });
    } catch (err) {
      console.error("Clear notifications failed:", err);
    }
  }, [state.user]);

  const getFriends = useCallback(async () => {
    console.log("[store] getFriends CALLED. state.user:", state.user);
    if (!state.user) {
      console.log("[store] getFriends returning early: state.user is falsy");
      return [];
    }
    
    try {
      // Fetch both directions
      console.log("[store] getFriends querying 'friends' table for user ID:", state.user.id);
      const { data: friendships, error } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${state.user.id},friend_id.eq.${state.user.id}`);

      if (error) {
        console.error("[store] getFriends Supabase select error:", error);
        throw error;
      }
      console.log("[store] getFriends friendships result:", friendships);
      if (!friendships || friendships.length === 0) {
        console.log("[store] getFriends returning empty array (no friendships found)");
        return [];
      }

      // Extract unique friend IDs
      const friendIds = friendships.map(f => f.user_id === state.user!.id ? f.friend_id : f.user_id);
      console.log("[store] getFriends unique friendIds:", friendIds);

      // Fetch profiles for those IDs
      const { data: friendProfiles, error: profError } = await supabase
        .from('profiles')
        .select('id, name, total_xp, orb_hue')
        .in('id', friendIds);

      if (profError) {
        console.error("[store] getFriends profError:", profError);
        throw profError;
      }
      console.log("[store] getFriends friendProfiles result:", friendProfiles);

      // Fetch recent messages for these friends in one go
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${state.user!.id},receiver_id.eq.${state.user!.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      const lastMessages = friendIds.map(friendId => {
        return (recentMessages || []).find(m => 
          (m.sender_id === state.user!.id && m.receiver_id === friendId) || 
          (m.sender_id === friendId && m.receiver_id === state.user!.id)
        );
      }).filter(Boolean);

      const result = friendships.map(f => {
        const friendId = f.user_id === state.user!.id ? f.friend_id : f.user_id;
        const profile = friendProfiles?.find(p => p.id === friendId);
        const lastMessage = lastMessages.find(m => m && (m.sender_id === friendId || m.receiver_id === friendId));

        return {
          friendshipId: f.id,
          id: friendId,
          name: profile?.name || 'Unknown User',
          status: f.status,
          total_xp: profile?.total_xp || 0,
          orb_hue: profile?.orb_hue || 200,
          isIncoming: f.friend_id === state.user!.id,
          last_message: lastMessage || null
        };
      });

      // Defensive Deduplication: Prioritize 'accepted' records over 'pending'
      const uniqueMap = new Map<string, any>();
      for (const item of result) {
        const existing = uniqueMap.get(item.id);
        if (!existing) {
          uniqueMap.set(item.id, item);
        } else {
          if (item.status === 'accepted' && existing.status !== 'accepted') {
            uniqueMap.set(item.id, item);
          }
        }
      }
      const deduplicated = Array.from(uniqueMap.values());
      console.log("[store] getFriends SUCCESS. Deduplicated output:", deduplicated);
      return deduplicated;
    } catch (err) {
      console.error("[store] Fetch friends failed with exception:", err);
      return [];
    }
  }, [state.user]);

  const getLeaderboard = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, total_xp, orb_hue')
      .order('total_xp', { ascending: false })
      .limit(50);
    
    return (data || []).map(p => ({
      ...p,
      rank: getRankFromLevel(getLevelFromXp(p.total_xp))
    }));
  }, []);

  const acceptFriendRequest = useCallback(async (friendshipId: string) => {
    if (!state.user) return;
    try {
      // Get the friend request details
      const { data: request } = await supabase
        .from('friends')
        .select('*')
        .eq('id', friendshipId)
        .single();
      
      if (!request) return;

      // Update this record to accepted
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);
      
      if (error) throw error;

      // Clean up any duplicate/secondary pending records between the two users
      await supabase
        .from('friends')
        .delete()
        .neq('id', friendshipId)
        .or(`and(user_id.eq.${request.user_id},friend_id.eq.${request.friend_id}),and(user_id.eq.${request.friend_id},friend_id.eq.${request.user_id})`);

    } catch (err) {
      console.error("Accept friend failed:", err);
    }
  }, [state.user]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);
      if (error) throw error;
    } catch (err) {
      console.error("Remove friend failed:", err);
    }
  }, [state.user]);

  const sendMessage = useCallback(async (receiverId: string, content: string) => {
    if (!state.user) return;
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: state.user.id,
        receiver_id: receiverId,
        content
      });
      if (error) throw error;
    } catch (err) {
      console.error("Message send failed:", err);
    }
  }, [state.user]);

  const getMessages = useCallback(async (otherId: string) => {
    if (!state.user) return [];
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${state.user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${state.user.id})`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Fetch messages failed:", err);
      return [];
    }
  }, [state.user]);

  const markMessagesAsRead = useCallback(async (senderId: string) => {
    if (!state.user) return;
    try {
      // Mark messages where I am the receiver and they are the sender
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', state.user.id)
        .eq('sender_id', senderId)
        .eq('is_read', false);
      
      if (error) {
        console.error("Read Receipt Update Error (check RLS):", error);
      }
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  }, [state.user]);

  // ── Battle & Matchmaking ──────────────────────

  const joinMatchmaking = useCallback(async (deckId: string) => {
    if (!state.user) return;
    // matchmaking_queue only has: user_id, deck_id, matched_duel_id
    await supabase.from('matchmaking_queue').upsert({
      user_id: state.user.id,
      deck_id: deckId
    });
  }, [state.user]);

  const leaveMatchmaking = useCallback(async () => {
    if (!state.user) return;
    await supabase.from('matchmaking_queue').delete().eq('user_id', state.user.id);
  }, [state.user]);

  const getMatch = useCallback(async () => {
    if (!state.user) return null;
    try {
      // 1. Check if WE have been matched by someone else
      const { data: myEntry } = await supabase
        .from('matchmaking_queue')
        .select('matched_duel_id')
        .eq('user_id', state.user.id)
        .single();
      
      if (myEntry?.matched_duel_id) {
        return { duelId: myEntry.matched_duel_id };
      }

      // 2. Look for someone else to match with
      const { data, error } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .is('matched_duel_id', null)
        .neq('user_id', state.user.id)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      return {
        opponentId: data.user_id,
        opponentName: 'Hunter detected'
      };
    } catch (err) {
      console.error("Get match failed:", err);
      return null;
    }
  }, [state.user]);

  const createDuel = useCallback(async (mode: 'writing' | 'deck', opponentId: string, deckId?: string, initialStatus: 'invited' | 'setup' = 'invited') => {
    if (!state.user) return '';
    try {
      // Verified columns: player1_id, player2_id, mode, status, p1_deck_id, p2_deck_id
      const { data, error } = await supabase.from('duels').insert({
        player1_id: state.user.id,
        player2_id: opponentId,
        mode,
        p1_deck_id: deckId || null,
        status: initialStatus
      }).select().single();
      if (error) throw error;
      return data.id;
    } catch (err: any) {
      console.error("Create duel failed:", err);
      const errMsg = err?.message || JSON.stringify(err);
      alert(`SYSTEM MATRIX ERROR:\n${errMsg}`);
      return '';
    }
  }, [state.user]);

  const updateDuel = useCallback(async (duelId: string, updates: any) => {
    try {
      const { error } = await supabase.from('duels').update(updates).eq('id', duelId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Update duel failed:", err);
      throw err;
    }
  }, []);

  const getDuel = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('duels')
      .select(`
        *,
        p1:profiles!player1_id(name, total_xp),
        p2:profiles!player2_id(name, total_xp)
      `)
      .eq('id', id)
      .single();
    if (error) {
      console.error("Get duel failed:", error);
      return null;
    }
    return data;
  }, []);

  const getPublicDuels = useCallback(async () => {
    const { data, error } = await supabase
      .from('duels')
      .select(`
        *,
        p1:profiles!player1_id(name),
        p2:profiles!player2_id(name),
        community_duel_votes(*)
      `)
      .in('status', ['community_review', 'finished'])
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      console.error("Get public duels failed:", error);
      return [];
    }
    return data;
  }, []);

  const submitCommunityHonourVote = useCallback(async (duel: any, targetPlayer: 'p1' | 'p2', isReasonable: boolean) => {
    if (!state.user) return;

    const targetUserId = targetPlayer === 'p1' ? duel.player1_id : duel.player2_id;
    const reviewerId = targetPlayer === 'p1' ? duel.player2_id : duel.player1_id;
    if (state.user.id === targetUserId || state.user.id === reviewerId) {
      throw new Error('Duel participants cannot vote on their own honour review.');
    }

    const rating = Number(duel[`${targetPlayer}_review_rating`] || 0);
    if (rating <= 0) throw new Error('This honour has not been submitted yet.');
    if (duel[`${targetPlayer}_honour_finalized`]) throw new Error('This honour has already been finalized.');

    const { error } = await supabase.rpc('submit_community_honour_vote', {
      p_duel_id: duel.id,
      p_target_player: targetPlayer,
      p_is_reasonable: isReasonable,
    });
    if (error) throw error;
  }, [state.user]);

  const contextValue = useMemo(() => ({
    state, isLoading, session,
    setUser, resetUser, deleteAccount, signOut,
    addXp, getLevel, getRank, getXpProgress: getXpProgressData,
    addFocusSession, getTodayFocusTime, getTodaySessionCount, getLongestSession, getFocusStreak, getWeeklyFocusData,
    addDeck, updateDeck, deleteDeck,
    addCard, addCards, updateCard, deleteCard, getDeckCards, getDueCards, getDeckStats, reviewCard,
    addDeckStudySession,
    getTotalFocusTime, getTotalCardsStudied, getTotalCardsMastered, getStudyHeatmap, getAchievements,
    getTodayXp, getTodayDeckSessions, getTodayCardsReviewed, getDailyMissions, getRecentActivity, getAllDueCards,
    addArenaSession, getArenaStats, getDeckArenaHistory,
    getWeeklyInsights, getMilestones,
    getOrbHue,
    rankUpTrigger, triggerRankUpCinematic,
    isOrbHidden, setOrbHidden,
    searchUsers, isUsernameAvailable, sendFriendRequest, acceptFriendRequest, removeFriend, getFriends, getLeaderboard, sendMessage, getMessages, markMessagesAsRead,
    sendDuelInvite, acceptDuelInvite, cancelDuel, dismissNotification, getNotifications, clearNotifications,
    joinMatchmaking, leaveMatchmaking, getMatch, createDuel, updateDuel, getDuel, getPublicDuels, submitCommunityHonourVote
  }), [
    state, isLoading, session, setUser, resetUser, deleteAccount, signOut, addXp, getLevel, getRank, getXpProgressData,
    addFocusSession, getTodayFocusTime, getTodaySessionCount, getLongestSession, getFocusStreak, getWeeklyFocusData,
    addDeck, updateDeck, deleteDeck, addCard, addCards, updateCard, deleteCard, getDeckCards, getDueCards, getDeckStats, reviewCard,
    addDeckStudySession, getTotalFocusTime, getTotalCardsStudied, getTotalCardsMastered, getStudyHeatmap, getAchievements,
    getTodayXp, getTodayDeckSessions, getTodayCardsReviewed, getDailyMissions, getRecentActivity, getAllDueCards,
    addArenaSession, getArenaStats, getDeckArenaHistory, getWeeklyInsights, getMilestones, getOrbHue, 
    rankUpTrigger, triggerRankUpCinematic,
    isOrbHidden, setOrbHidden,
    searchUsers, isUsernameAvailable, sendFriendRequest, acceptFriendRequest, removeFriend, getFriends, getLeaderboard, sendMessage, getMessages, markMessagesAsRead,
    sendDuelInvite, acceptDuelInvite, cancelDuel, dismissNotification, getNotifications, clearNotifications,
    joinMatchmaking, leaveMatchmaking, getMatch, createDuel, updateDuel, getDuel, getPublicDuels, submitCommunityHonourVote
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
