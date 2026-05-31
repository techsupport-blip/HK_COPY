import type { Profile } from "@prisma/client";
import { parseJson } from "../lib/json.js";
import { prisma } from "../lib/prisma.js";
import { canonicalPair, todayKey } from "../lib/match.js";
import { badRequest, notFound } from "../lib/errors.js";
import { getAi, type CandidateInput } from "../ai/client.js";
import { generateScoredCandidates } from "./compatibility.service.js";
import type { TasteProfile } from "@hearth/shared";

/** How many top deterministic candidates to send to Claude for reranking. */
const RERANK_POOL = 10;
/** How many curated matches to surface per generation. */
const DAILY_MATCH_COUNT = 5;

/**
 * The core matchmaking mechanic:
 *   1. deterministic hard-filter + score (compatibility.service)
 *   2. Claude reranks the shortlist and writes rationales
 *   3. persist the top few as Match rows ("today's matches")
 */
export async function generateDailyMatches(userId: string): Promise<number> {
  const viewer = await prisma.profile.findUnique({ where: { userId } });
  if (!viewer) throw notFound("Profile not found");
  if (!viewer.onboardingComplete) {
    throw badRequest("Complete onboarding before generating matches");
  }

  const candidates = await generateScoredCandidates(viewer);
  if (candidates.length === 0) return 0;

  const shortlist = candidates.slice(0, RERANK_POOL);

  // Claude rerank + rationale (mock provider returns deterministic output).
  const ai = getAi();
  const aiInput: CandidateInput[] = shortlist.map((c) => ({
    candidateUserId: c.profile.userId,
    summary: c.profile.tasteProfileSummary || c.profile.bio,
    subscore: c.breakdown.total,
  }));
  const reranked = await ai.rerankMatches(
    viewer.tasteProfileSummary || viewer.bio,
    aiInput,
  );

  // Index AI results by candidate, falling back to deterministic score.
  const byId = new Map(reranked.results.map((r) => [r.candidateUserId, r]));
  const enriched = shortlist
    .map((c) => {
      const ai = byId.get(c.profile.userId);
      return {
        candidate: c,
        score: ai?.adjustedScore ?? c.breakdown.total,
        rationale: ai?.rationale ?? "",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, DAILY_MATCH_COUNT);

  const batch = todayKey();
  let created = 0;
  for (const item of enriched) {
    const pair = canonicalPair(viewer.userId, item.candidate.profile.userId);
    await prisma.match.upsert({
      where: { userAId_userBId: pair },
      create: {
        ...pair,
        compatibilityScore: item.score,
        scoreBreakdown: JSON.stringify(item.candidate.breakdown),
        rationale: item.rationale,
        surfacedDate: batch,
      },
      update: {}, // never clobber an existing pair
    });
    created++;
  }
  return created;
}

/** Build the AI ProfileLite payload from a stored profile. */
export function toProfileLite(profile: Profile) {
  const taste = parseJson<TasteProfile | null>(profile.tasteProfile, null);
  return {
    displayName: profile.displayName,
    interests: taste?.interests ?? [],
    summary: profile.tasteProfileSummary || profile.bio,
  };
}
