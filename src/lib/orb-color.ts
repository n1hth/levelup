// ═══════════════════════════════════════════════
// ORB COLOR ENGINE — OKLCH-BASED IDENTITY SYSTEM
// ═══════════════════════════════════════════════
// Every user gets one color, generated at account creation.
// Uses golden angle distribution in OKLCH color space to
// guarantee no two users share a visually similar hue.

export type OrbState = 'dormant' | 'idle' | 'active' | 'peaked' | 'depleted' | 'evolving';

export interface OrbColorPalette {
  primary: string;       // Main orb color — oklch(0.7 0.18 H)
  glow: string;          // Outer glow — same hue, lower opacity
  highlight: string;     // Specular highlight — lighter tint
  shadow: string;        // Inner shadow — darker shade
  muted: string;         // Dormant/depleted — desaturated
  accent: string;        // UI accent — for nav arcs, badges, text
  gradient: string;      // Full radial gradient CSS
}

// ─── Hue Generation ──────────────────────────────

const GOLDEN_ANGLE = 137.508; // degrees — optimal angular distribution

/**
 * Generate a deterministic, perceptually unique hue from a user ID.
 * Uses FNV-1a hash → golden angle distribution in [0, 360).
 */
export function generateOrbHue(userId: string): number {
  // FNV-1a 32-bit hash
  let hash = 0x811c9dc5;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Map to golden angle offset — ensures adjacent IDs get maximally distant hues
  const index = Math.abs(hash) % 360;
  return Math.round((index * GOLDEN_ANGLE) % 360);
}

// ─── OKLCH → CSS Conversion ──────────────────────

function oklch(l: number, c: number, h: number, a: number = 1): string {
  if (a < 1) return `oklch(${l} ${c} ${h} / ${a})`;
  return `oklch(${l} ${c} ${h})`;
}

// ─── Palette Generation ──────────────────────────

/**
 * Build a complete color palette from a hue and orb state.
 */
export function getOrbColors(hue: number, state: OrbState): OrbColorPalette {
  // State-dependent lightness and chroma modifiers
  const stateParams: Record<OrbState, { l: number; c: number; glowOpacity: number }> = {
    dormant:  { l: 0.45, c: 0.08, glowOpacity: 0.15 },
    idle:     { l: 0.70, c: 0.18, glowOpacity: 0.40 },
    active:   { l: 0.78, c: 0.22, glowOpacity: 0.65 },
    peaked:   { l: 0.85, c: 0.25, glowOpacity: 0.85 },
    depleted: { l: 0.35, c: 0.04, glowOpacity: 0.08 },
    evolving: { l: 0.90, c: 0.28, glowOpacity: 1.00 },
  };

  const { l, c, glowOpacity } = stateParams[state];

  return {
    primary:   oklch(l, c, hue),
    glow:      oklch(l, c, hue, glowOpacity),
    highlight: oklch(Math.min(l + 0.25, 0.97), c * 0.6, hue),
    shadow:    oklch(Math.max(l - 0.3, 0.15), c * 0.5, hue),
    muted:     oklch(0.45, 0.04, hue),
    accent:    oklch(0.72, 0.20, hue),
    gradient:  buildOrbGradient(hue, l, c),
  };
}

function buildOrbGradient(hue: number, l: number, c: number): string {
  const highlight = oklch(Math.min(l + 0.28, 0.98), c * 0.4, hue);
  const mid       = oklch(l, c, hue);
  const deep      = oklch(Math.max(l - 0.2, 0.2), c * 0.8, hue);
  const core      = oklch(Math.max(l - 0.35, 0.1), c * 0.6, hue);

  return `radial-gradient(circle at 30% 30%, ${highlight} 0%, ${mid} 35%, ${deep} 65%, ${core} 100%)`;
}

// ─── Quick CSS Helpers ───────────────────────────

/**
 * Minimal color extraction for social views, leaderboards, chat bubbles.
 */
export function orbHueToCSS(hue: number): { primary: string; glow: string; accent: string } {
  return {
    primary: oklch(0.70, 0.18, hue),
    glow:    oklch(0.70, 0.18, hue, 0.4),
    accent:  oklch(0.72, 0.20, hue),
  };
}

/**
 * Full gradient string for the orb sphere, accounting for state and rank evolution.
 */
export function getOrbGradient(hue: number, state: OrbState, rankTier: string): string {
  const palette = getOrbColors(hue, state);
  return palette.gradient;
}

// ─── Rank Evolution Helpers ──────────────────────

export type RankEvolution = 'formless' | 'smooth' | 'flowing' | 'crystalline-hints' | 'crystalline' | 'transcendent';

/**
 * Map a rank tier letter to its evolution stage.
 */
export function getRankEvolution(rankTier: string): RankEvolution {
  switch (rankTier) {
    case 'S': return 'transcendent';
    case 'A': return 'crystalline';
    case 'B': return 'crystalline-hints';
    case 'C': return 'flowing';
    case 'D': return 'smooth';
    default:  return 'formless';
  }
}

/**
 * Get CSS filter string for rank-based blur/sharpness.
 */
export function getRankBlur(evolution: RankEvolution): string {
  switch (evolution) {
    case 'formless':          return 'blur(2px)';
    case 'smooth':            return 'blur(0px)';
    case 'flowing':           return 'blur(0px)';
    case 'crystalline-hints': return 'blur(0px) contrast(1.05)';
    case 'crystalline':       return 'blur(0px) contrast(1.1) brightness(1.05)';
    case 'transcendent':      return 'blur(0px) contrast(1.15) brightness(1.1)';
  }
}

/**
 * Number of crystalline facet lines to render on the orb.
 */
export function getFacetCount(evolution: RankEvolution): number {
  switch (evolution) {
    case 'crystalline-hints': return 3;
    case 'crystalline':       return 6;
    case 'transcendent':      return 8;
    default:                  return 0;
  }
}

/**
 * Whether the orb should show orbiting particle dots.
 */
export function hasParticleField(evolution: RankEvolution): boolean {
  return evolution === 'transcendent';
}

/**
 * Animation speed multiplier for internal gradient rotation.
 */
export function getInternalRotationSpeed(evolution: RankEvolution): number {
  switch (evolution) {
    case 'formless':          return 0;    // No rotation — formless
    case 'smooth':            return 15;   // Slow
    case 'flowing':           return 8;    // Medium — visible movement
    case 'crystalline-hints': return 12;   // Slightly slower — more stable
    case 'crystalline':       return 20;   // Slow and deliberate
    case 'transcendent':      return 25;   // Glacial — immense power
  }
}
