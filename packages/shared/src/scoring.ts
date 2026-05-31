import type { PersonalityTraits, TasteProfile } from "./taste.js";
import type { EnergyLevel } from "./enums.js";

/**
 * Deterministic compatibility scoring. Pure functions, no I/O, no AI — this is
 * the testable core of the matchmaker. The AI layer only *reranks* the top
 * shortlist these scores produce.
 *
 * Total score is 0..100. Weights sum to 100. A dealbreaker violation zeroes the
 * whole score (a hard incompatibility).
 */
export const SCORE_WEIGHTS = {
  interests: 35,
  values: 25,
  personality: 25,
  energy: 15,
} as const;

export interface ScoreBreakdown {
  /** 0..1 per dimension, before weighting. */
  interests: number;
  values: number;
  personality: number;
  energy: number;
  /** True if a dealbreaker forced the total to zero. */
  dealbreakerHit: boolean;
  /** Final weighted score, 0..100. */
  total: number;
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function toSet(tags: string[]): Set<string> {
  return new Set(tags.map(normalizeTag).filter(Boolean));
}

/** Jaccard similarity of two tag lists: |A ∩ B| / |A ∪ B|. */
export function jaccard(a: string[], b: string[]): number {
  const setA = toSet(a);
  const setB = toSet(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const tag of setA) if (setB.has(tag)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const ENERGY_INDEX: Record<EnergyLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

/** 1.0 when energy levels match, 0.5 one step apart, 0.0 two apart. */
export function energyProximity(a: EnergyLevel, b: EnergyLevel): number {
  const distance = Math.abs(ENERGY_INDEX[a] - ENERGY_INDEX[b]);
  return 1 - distance / 2;
}

const TRAIT_KEYS: (keyof PersonalityTraits)[] = [
  "introversion",
  "adventurousness",
  "warmth",
  "ambition",
  "playfulness",
];

/**
 * Personality alignment as 1 minus the mean absolute difference across traits.
 * Closer traits → higher alignment. (A simple, explainable heuristic; opposites
 * attracting can be modeled later.)
 */
export function personalityAlignment(
  a: PersonalityTraits,
  b: PersonalityTraits,
): number {
  let sum = 0;
  for (const key of TRAIT_KEYS) sum += Math.abs(a[key] - b[key]);
  return 1 - sum / TRAIT_KEYS.length;
}

/**
 * True if either person lists a dealbreaker that matches one of the other's
 * interests or values (case-insensitive tag match).
 */
export function hasDealbreakerConflict(a: TasteProfile, b: TasteProfile): boolean {
  const aTraits = toSet([...a.interests, ...a.values]);
  const bTraits = toSet([...b.interests, ...b.values]);
  for (const db of a.dealbreakers) if (bTraits.has(normalizeTag(db))) return true;
  for (const db of b.dealbreakers) if (aTraits.has(normalizeTag(db))) return true;
  return false;
}

/** Compute the full compatibility breakdown between two taste profiles. */
export function scoreCompatibility(
  a: TasteProfile,
  b: TasteProfile,
): ScoreBreakdown {
  const interests = jaccard(a.interests, b.interests);
  const values = jaccard(a.values, b.values);
  const personality = personalityAlignment(a.personalityTraits, b.personalityTraits);
  const energy = energyProximity(a.energyLevel, b.energyLevel);

  const dealbreakerHit = hasDealbreakerConflict(a, b);

  const weighted =
    interests * SCORE_WEIGHTS.interests +
    values * SCORE_WEIGHTS.values +
    personality * SCORE_WEIGHTS.personality +
    energy * SCORE_WEIGHTS.energy;

  const total = dealbreakerHit ? 0 : Math.round(weighted);

  return { interests, values, personality, energy, dealbreakerHit, total };
}
