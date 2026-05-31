import { z } from "zod";
import { ActivityCategory, PersonalityTraits, EnergyLevel } from "@hearth/shared";

/** AI output: the next interview question, or a signal that the interview is done. */
export const NextQuestionOutput = z.object({
  done: z.boolean(),
  question: z.string().nullable(),
});
export type NextQuestionOutput = z.infer<typeof NextQuestionOutput>;

/** AI output: structured taste profile extracted from the interview transcript. */
export const TasteExtractionOutput = z.object({
  interests: z.array(z.string()).max(20),
  values: z.array(z.string()).max(12),
  personalityTraits: PersonalityTraits,
  dealbreakers: z.array(z.string()).max(8),
  idealDateVibe: z.string(),
  energyLevel: EnergyLevel,
  summary: z.string(),
});
export type TasteExtractionOutput = z.infer<typeof TasteExtractionOutput>;

/** AI output: reranked shortlist with rationales. */
export const RerankOutput = z.object({
  results: z.array(
    z.object({
      candidateUserId: z.string(),
      adjustedScore: z.number().min(0).max(100),
      rationale: z.string(),
    }),
  ),
});
export type RerankOutput = z.infer<typeof RerankOutput>;

/** AI output: suggested real-world activities. */
export const ActivitiesOutput = z.object({
  activities: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        category: ActivityCategory,
        rationale: z.string(),
        mockVenueName: z.string(),
      }),
    )
    .max(5),
});
export type ActivitiesOutput = z.infer<typeof ActivitiesOutput>;

/** AI output: wingman suggestions (openers or replies). */
export const SuggestionsOutput = z.object({
  suggestions: z.array(z.string()).max(4),
});
export type SuggestionsOutput = z.infer<typeof SuggestionsOutput>;
