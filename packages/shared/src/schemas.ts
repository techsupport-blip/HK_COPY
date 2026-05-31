import { z } from "zod";
import {
  ActivityCategory,
  EnergyLevel,
  Gender,
  InterviewRole,
  InterviewStatus,
  MatchState,
  MessageKind,
} from "./enums.js";
import { TasteProfile } from "./taste.js";

/* ----------------------------- Auth ----------------------------- */

export const RegisterRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(60),
});
export type RegisterRequest = z.infer<typeof RegisterRequest>;

export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const RefreshRequest = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshRequest = z.infer<typeof RefreshRequest>;

export const AuthTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof AuthTokens>;

/* ---------------------------- Profile --------------------------- */

export const ProfileDTO = z.object({
  id: z.string(),
  userId: z.string(),
  displayName: z.string(),
  age: z.number().int().nullable(),
  gender: Gender.nullable(),
  seekingGenders: z.array(Gender),
  bio: z.string(),
  city: z.string().nullable(),
  photoUrls: z.array(z.string()),
  tasteProfileSummary: z.string(),
  onboardingComplete: z.boolean(),
});
export type ProfileDTO = z.infer<typeof ProfileDTO>;

export const UpdateProfileRequest = z.object({
  displayName: z.string().min(1).max(60).optional(),
  age: z.number().int().min(18).max(120).optional(),
  gender: Gender.optional(),
  seekingGenders: z.array(Gender).optional(),
  bio: z.string().max(1000).optional(),
  city: z.string().max(120).optional(),
  photoUrls: z.array(z.string().url()).max(6).optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequest>;

export const MeResponse = z.object({
  id: z.string(),
  email: z.string(),
  profile: ProfileDTO,
});
export type MeResponse = z.infer<typeof MeResponse>;

/* --------------------------- Interview -------------------------- */

export const InterviewTurnDTO = z.object({
  role: InterviewRole,
  content: z.string(),
  order: z.number().int(),
});
export type InterviewTurnDTO = z.infer<typeof InterviewTurnDTO>;

export const InterviewStateResponse = z.object({
  status: InterviewStatus,
  turns: z.array(InterviewTurnDTO),
  /** Present once status === "complete". */
  tasteProfileSummary: z.string().nullable(),
});
export type InterviewStateResponse = z.infer<typeof InterviewStateResponse>;

export const InterviewTurnRequest = z.object({
  content: z.string().min(1).max(2000),
});
export type InterviewTurnRequest = z.infer<typeof InterviewTurnRequest>;

/** Response after starting or advancing the interview. */
export const InterviewReplyResponse = z.object({
  status: InterviewStatus,
  /** Next AI question, or null when the interview just completed. */
  question: z.string().nullable(),
  done: z.boolean(),
  tasteProfileSummary: z.string().nullable(),
});
export type InterviewReplyResponse = z.infer<typeof InterviewReplyResponse>;

/* ---------------------------- Matches --------------------------- */

export const ScoreBreakdownDTO = z.object({
  interests: z.number(),
  values: z.number(),
  personality: z.number(),
  energy: z.number(),
  total: z.number(),
});
export type ScoreBreakdownDTO = z.infer<typeof ScoreBreakdownDTO>;

export const MatchSummaryDTO = z.object({
  id: z.string(),
  otherUserId: z.string(),
  displayName: z.string(),
  age: z.number().int().nullable(),
  city: z.string().nullable(),
  photoUrls: z.array(z.string()),
  compatibilityScore: z.number(),
  rationaleTeaser: z.string(),
  myState: MatchState,
  mutual: z.boolean(),
});
export type MatchSummaryDTO = z.infer<typeof MatchSummaryDTO>;

export const MatchDetailDTO = MatchSummaryDTO.extend({
  bio: z.string(),
  rationale: z.string(),
  scoreBreakdown: ScoreBreakdownDTO,
  tasteProfileSummary: z.string(),
  conversationId: z.string().nullable(),
});
export type MatchDetailDTO = z.infer<typeof MatchDetailDTO>;

export const ActivityDTO = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: ActivityCategory,
  rationale: z.string(),
  mockVenueName: z.string(),
});
export type ActivityDTO = z.infer<typeof ActivityDTO>;

/* -------------------------- Conversations ----------------------- */

export const MessageDTO = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string().nullable(),
  kind: MessageKind,
  content: z.string(),
  createdAt: z.string(),
  mine: z.boolean(),
});
export type MessageDTO = z.infer<typeof MessageDTO>;

export const ConversationDTO = z.object({
  id: z.string(),
  matchId: z.string(),
  otherUserId: z.string(),
  otherDisplayName: z.string(),
  otherPhotoUrls: z.array(z.string()),
  lastMessageAt: z.string().nullable(),
});
export type ConversationDTO = z.infer<typeof ConversationDTO>;

export const SendMessageRequest = z.object({
  content: z.string().min(1).max(2000),
});
export type SendMessageRequest = z.infer<typeof SendMessageRequest>;

export const WingmanResponse = z.object({
  suggestions: z.array(z.string()),
});
export type WingmanResponse = z.infer<typeof WingmanResponse>;

/* ----------------------------- Misc ----------------------------- */

export const ErrorResponse = z.object({
  error: z.string(),
  message: z.string(),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;

/** Re-exported so consumers can import everything from one place. */
export { TasteProfile, Gender, EnergyLevel };
