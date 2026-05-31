import type {
  ActivitySuggestion,
  Conversation,
  Match,
  Message,
  Profile,
} from "@prisma/client";
import type {
  ActivityDTO,
  ConversationDTO,
  Gender,
  MatchDetailDTO,
  MatchState,
  MatchSummaryDTO,
  MessageDTO,
  MessageKind,
  ProfileDTO,
  ScoreBreakdownDTO,
} from "@hearth/shared";
import { parseJson } from "./json.js";

export function toProfileDTO(p: Profile): ProfileDTO {
  return {
    id: p.id,
    userId: p.userId,
    displayName: p.displayName,
    age: p.age,
    gender: (p.gender as Gender | null) ?? null,
    seekingGenders: parseJson<Gender[]>(p.seekingGenders, []),
    bio: p.bio,
    city: p.city,
    photoUrls: parseJson<string[]>(p.photoUrls, []),
    tasteProfileSummary: p.tasteProfileSummary,
    onboardingComplete: p.onboardingComplete,
  };
}

/** Resolve which side of a match the viewer is on. */
export function matchPerspective(match: Match, viewerId: string) {
  const isA = match.userAId === viewerId;
  return {
    otherUserId: isA ? match.userBId : match.userAId,
    myState: (isA ? match.userAState : match.userBState) as MatchState,
  };
}

export function toMatchSummaryDTO(
  match: Match,
  otherProfile: Profile,
  viewerId: string,
): MatchSummaryDTO {
  const { otherUserId, myState } = matchPerspective(match, viewerId);
  return {
    id: match.id,
    otherUserId,
    displayName: otherProfile.displayName,
    age: otherProfile.age,
    city: otherProfile.city,
    photoUrls: parseJson<string[]>(otherProfile.photoUrls, []),
    compatibilityScore: match.compatibilityScore,
    rationaleTeaser: teaser(match.rationale),
    myState,
    mutual: match.mutual,
  };
}

export function toMatchDetailDTO(
  match: Match & { conversation: Conversation | null },
  otherProfile: Profile,
  viewerId: string,
): MatchDetailDTO {
  const summary = toMatchSummaryDTO(match, otherProfile, viewerId);
  return {
    ...summary,
    bio: otherProfile.bio,
    rationale: match.rationale,
    scoreBreakdown: parseJson<ScoreBreakdownDTO>(match.scoreBreakdown, {
      interests: 0,
      values: 0,
      personality: 0,
      energy: 0,
      total: match.compatibilityScore,
    }),
    tasteProfileSummary: otherProfile.tasteProfileSummary,
    conversationId: match.conversation?.id ?? null,
  };
}

export function toActivityDTO(a: ActivitySuggestion): ActivityDTO {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.category as ActivityDTO["category"],
    rationale: a.rationale,
    mockVenueName: a.mockVenueName,
  };
}

export function toConversationDTO(
  conversation: Conversation,
  match: Match,
  otherProfile: Profile,
): ConversationDTO {
  return {
    id: conversation.id,
    matchId: match.id,
    otherUserId: otherProfile.userId,
    otherDisplayName: otherProfile.displayName,
    otherPhotoUrls: parseJson<string[]>(otherProfile.photoUrls, []),
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
  };
}

export function toMessageDTO(m: Message, viewerId: string): MessageDTO {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    kind: m.kind as MessageKind,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    mine: m.senderId === viewerId,
  };
}

/** First sentence (or ~120 chars) of a rationale, for match cards. */
function teaser(rationale: string): string {
  if (!rationale) return "";
  const firstSentence = rationale.split(/(?<=[.!?])\s/)[0] ?? rationale;
  return firstSentence.length > 140
    ? firstSentence.slice(0, 137).trimEnd() + "…"
    : firstSentence;
}
