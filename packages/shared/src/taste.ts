import { z } from "zod";
import { EnergyLevel } from "./enums.js";

/**
 * Personality traits scored 0..1. A small fixed set keeps scoring deterministic
 * and keeps the AI extraction prompt focused. Extendable later.
 */
export const PersonalityTraits = z.object({
  introversion: z.number().min(0).max(1),
  adventurousness: z.number().min(0).max(1),
  warmth: z.number().min(0).max(1),
  ambition: z.number().min(0).max(1),
  playfulness: z.number().min(0).max(1),
});
export type PersonalityTraits = z.infer<typeof PersonalityTraits>;

/**
 * The structured distillation of a user's onboarding interview. This is the
 * single object the matchmaker scores against — produced deterministically at
 * seed time and by the AI extraction step for real users.
 */
export const TasteProfile = z.object({
  interests: z.array(z.string()).default([]),
  values: z.array(z.string()).default([]),
  personalityTraits: PersonalityTraits,
  dealbreakers: z.array(z.string()).default([]),
  idealDateVibe: z.string().default(""),
  energyLevel: EnergyLevel,
});
export type TasteProfile = z.infer<typeof TasteProfile>;

export const EMPTY_PERSONALITY: PersonalityTraits = {
  introversion: 0.5,
  adventurousness: 0.5,
  warmth: 0.5,
  ambition: 0.5,
  playfulness: 0.5,
};
