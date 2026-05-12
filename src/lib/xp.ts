// ═══════════════════════════════════════════════
// XP & PROGRESSION ENGINE
// ═══════════════════════════════════════════════

export const BASE_XP_PER_MIN = 10;
export const COMPLETION_BONUS = 50;
export const NO_PAUSE_BONUS = 25;
export const STREAK_BONUS = 15;

// Level N requires totalXpForLevel(N) cumulative XP
export function xpRequiredForLevel(level: number): number {
  return level * 100;
}

export function totalXpForLevel(level: number): number {
  // Sum of 1*100 + 2*100 + ... + level*100 = level*(level+1)/2 * 100
  return (level * (level + 1)) / 2 * 100;
}

export function getLevelFromXp(totalXp: number): number {
  // Inverse of totalXpForLevel: solve level*(level+1)/2 * 100 = totalXp
  // level^2 + level - 2*totalXp/100 = 0
  // level = (-1 + sqrt(1 + 8*totalXp/100)) / 2
  const level = Math.floor((-1 + Math.sqrt(1 + (8 * totalXp) / 100)) / 2);
  return Math.max(1, level);
}

export function getXpProgress(totalXp: number): { level: number; currentLevelXp: number; nextLevelXp: number; progress: number } {
  const level = getLevelFromXp(totalXp);
  const xpAtCurrentLevel = totalXpForLevel(level);
  const xpAtNextLevel = totalXpForLevel(level + 1);
  const currentLevelXp = totalXp - xpAtCurrentLevel;
  const nextLevelXp = xpAtNextLevel - xpAtCurrentLevel;
  const progress = Math.min(currentLevelXp / nextLevelXp, 1);

  return { level, currentLevelXp, nextLevelXp, progress };
}

export function getRankFromLevel(level: number): string {
  if (level >= 51) return 'S';
  if (level >= 36) return 'A';
  if (level >= 21) return 'B';
  if (level >= 11) return 'C';
  if (level >= 6) return 'D';
  return 'E';
}

export function getRankColor(rank: string): string {
  switch (rank) {
    case 'S': return '#fbbf24'; // Gold
    case 'A': return '#ef4444'; // Red
    case 'B': return '#a855f7'; // Purple
    case 'C': return '#3b82f6'; // Blue
    case 'D': return '#22c55e'; // Green
    case 'E': return '#94a3b8'; // Gray
    default: return '#94a3b8';
  }
}

export function getRankTitle(rank: string): string {
  switch (rank) {
    case 'S': return 'Sovereign Scholar';
    case 'A': return 'Arena Master';
    case 'B': return 'Focus Hunter';
    case 'C': return 'Knowledge Seeker';
    case 'D': return 'Card Apprentice';
    case 'E': return 'Novice Learner';
    default: return 'Novice Learner';
  }
}

export interface XpCalculation {
  baseXp: number;
  completionBonus: number;
  noPauseBonus: number;
  momentumMultiplier: number;
  totalXp: number;
  breakdown: { label: string; value: number }[];
}

export function calculateFocusXp(
  durationSeconds: number,
  actualSeconds: number,
  pauseCount: number,
  isCompleted: boolean,
  momentum: number,
  noPauseChallenge: boolean
): XpCalculation {
  const minutesFocused = Math.floor(actualSeconds / 60);
  const baseXp = minutesFocused * BASE_XP_PER_MIN;
  const completionBonus = isCompleted ? COMPLETION_BONUS : 0;
  const noPauseBonus = (noPauseChallenge && pauseCount === 0 && isCompleted) ? NO_PAUSE_BONUS : 0;

  const momentumMultiplier = 1 + (momentum * 0.1); // 10% per momentum level
  const subtotal = baseXp + completionBonus + noPauseBonus;
  const totalXp = Math.round(subtotal * momentumMultiplier);

  const breakdown: { label: string; value: number }[] = [
    { label: `${minutesFocused} min × ${BASE_XP_PER_MIN} XP`, value: baseXp },
  ];

  if (completionBonus > 0) {
    breakdown.push({ label: 'Completion Bonus', value: completionBonus });
  }
  if (noPauseBonus > 0) {
    breakdown.push({ label: 'No-Pause Bonus', value: noPauseBonus });
  }
  if (momentumMultiplier > 1) {
    breakdown.push({ label: `Momentum ×${momentumMultiplier.toFixed(1)}`, value: totalXp - subtotal });
  }

  return {
    baseXp,
    completionBonus,
    noPauseBonus,
    momentumMultiplier,
    totalXp,
    breakdown,
  };
}
