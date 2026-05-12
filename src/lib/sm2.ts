// ═══════════════════════════════════════════════
// SM-2 SPACED REPETITION ALGORITHM
// ═══════════════════════════════════════════════
// Based on the SuperMemo SM-2 algorithm.
// Rating: 0=Again, 1=Hard, 2=Good, 3=Easy

export type Rating = 0 | 1 | 2 | 3;

export const RATING_LABELS: Record<Rating, string> = {
  0: 'Again',
  1: 'Hard',
  2: 'Good',
  3: 'Easy',
};

export const RATING_COLORS: Record<Rating, string> = {
  0: '#ef4444', // red
  1: '#f59e0b', // amber
  2: '#22c55e', // green
  3: '#00d2ff', // cyan
};

export const RATING_XP: Record<Rating, number> = {
  0: 0,
  1: 5,
  2: 10,
  3: 15,
};

export type MasteryState = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface CardSM2 {
  interval: number;       // days until next review
  repetitions: number;    // successful reviews in a row
  easeFactor: number;     // difficulty multiplier (starts at 2.5)
  dueDate: string;        // ISO date string
  masteryState: MasteryState;
  lastReviewedAt: string | null;
}

export function defaultSM2(): CardSM2 {
  return {
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    masteryState: 'new',
    lastReviewedAt: null,
  };
}

export function applyReview(card: CardSM2, rating: Rating): CardSM2 {
  const now = new Date();
  let { interval, repetitions, easeFactor } = card;

  if (rating === 0) {
    // Again — reset to start
    interval = 1;
    repetitions = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === 1) {
    // Hard — small increase
    interval = Math.max(1, Math.round(interval * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    repetitions = Math.max(0, repetitions - 1);
  } else if (rating === 2) {
    // Good — standard SM-2
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Easy — accelerated
    if (repetitions === 0) {
      interval = 4;
    } else if (repetitions === 1) {
      interval = 10;
    } else {
      interval = Math.round(interval * easeFactor * 1.3);
    }
    easeFactor = Math.min(4.0, easeFactor + 0.1);
    repetitions += 1;
  }

  // Determine mastery state
  let masteryState: MasteryState;
  if (rating === 0) {
    masteryState = 'learning';
  } else if (repetitions < 2) {
    masteryState = 'learning';
  } else if (repetitions < 5) {
    masteryState = 'reviewing';
  } else {
    masteryState = 'mastered';
  }

  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    interval,
    repetitions,
    easeFactor,
    dueDate: dueDate.toISOString(),
    masteryState,
    lastReviewedAt: now.toISOString(),
  };
}

export function isDue(card: CardSM2): boolean {
  return new Date(card.dueDate) <= new Date();
}

export function getDaysUntilDue(card: CardSM2): number {
  const diff = new Date(card.dueDate).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getMasteryLabel(state: MasteryState): string {
  switch (state) {
    case 'new': return 'New';
    case 'learning': return 'Learning';
    case 'reviewing': return 'Reviewing';
    case 'mastered': return 'Mastered';
  }
}

export function getMasteryColor(state: MasteryState): string {
  switch (state) {
    case 'new': return '#94a3b8';
    case 'learning': return '#f59e0b';
    case 'reviewing': return '#3b82f6';
    case 'mastered': return '#22c55e';
  }
}
