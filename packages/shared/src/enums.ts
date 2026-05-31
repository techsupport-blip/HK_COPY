import { z } from "zod";

/** Genders supported in the MVP. Intentionally simple; extendable later. */
export const Gender = z.enum(["woman", "man", "nonbinary", "other"]);
export type Gender = z.infer<typeof Gender>;

/** Self-described energy level, used in compatibility scoring. */
export const EnergyLevel = z.enum(["low", "medium", "high"]);
export type EnergyLevel = z.infer<typeof EnergyLevel>;

/** Per-user state on a curated match. */
export const MatchState = z.enum(["pending", "liked", "passed"]);
export type MatchState = z.infer<typeof MatchState>;

/** Interview session lifecycle. */
export const InterviewStatus = z.enum(["in_progress", "complete"]);
export type InterviewStatus = z.infer<typeof InterviewStatus>;

/** Author role within the onboarding interview transcript. */
export const InterviewRole = z.enum(["assistant", "user"]);
export type InterviewRole = z.infer<typeof InterviewRole>;

/** Category of a suggested real-world activity. */
export const ActivityCategory = z.enum([
  "coffee",
  "outdoors",
  "culture",
  "food",
  "active",
]);
export type ActivityCategory = z.infer<typeof ActivityCategory>;

/** Kind of chat message — distinguishes human messages from wingman/system notes. */
export const MessageKind = z.enum(["user", "wingman_suggestion", "system"]);
export type MessageKind = z.infer<typeof MessageKind>;
