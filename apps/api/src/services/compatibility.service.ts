import type { Profile } from "@prisma/client";
import {
  scoreCompatibility,
  type Gender,
  type ScoreBreakdown,
  type TasteProfile,
} from "@hearth/shared";
import { prisma } from "../lib/prisma.js";
import { parseJson } from "../lib/json.js";
import { canonicalPair } from "../lib/match.js";

export interface ScoredCandidate {
  profile: Profile;
  taste: TasteProfile;
  breakdown: ScoreBreakdown;
}

function getTaste(profile: Profile): TasteProfile | null {
  if (!profile.tasteProfile) return null;
  const raw = parseJson<TasteProfile | null>(profile.tasteProfile, null);
  return raw;
}

/** Mutual gender/seeking compatibility. Empty seeking lists are treated as open. */
function genderCompatible(viewer: Profile, candidate: Profile): boolean {
  const viewerSeeks = parseJson<Gender[]>(viewer.seekingGenders, []);
  const candidateSeeks = parseJson<Gender[]>(candidate.seekingGenders, []);
  const viewerOkWithCandidate =
    viewerSeeks.length === 0 ||
    (candidate.gender != null && viewerSeeks.includes(candidate.gender as Gender));
  const candidateOkWithViewer =
    candidateSeeks.length === 0 ||
    (viewer.gender != null && candidateSeeks.includes(viewer.gender as Gender));
  return viewerOkWithCandidate && candidateOkWithViewer;
}

/**
 * Hard filters + deterministic scoring over the whole eligible pool. No AI.
 * Returns candidates sorted by compatibility, best first.
 */
export async function generateScoredCandidates(
  viewer: Profile,
): Promise<ScoredCandidate[]> {
  const viewerTaste = getTaste(viewer);
  if (!viewerTaste) return [];

  // Pull every other onboarded user's profile. Fine at MVP pool sizes.
  const others = await prisma.profile.findMany({
    where: {
      userId: { not: viewer.userId },
      onboardingComplete: true,
      tasteProfile: { not: null },
    },
  });

  // Exclude pairs that already have a Match row (already surfaced or acted on).
  const existing = await prisma.match.findMany({
    where: {
      OR: [{ userAId: viewer.userId }, { userBId: viewer.userId }],
    },
    select: { userAId: true, userBId: true },
  });
  const alreadyMatched = new Set(
    existing.map((m) => (m.userAId === viewer.userId ? m.userBId : m.userAId)),
  );

  const scored: ScoredCandidate[] = [];
  for (const candidate of others) {
    if (alreadyMatched.has(candidate.userId)) continue;
    if (!genderCompatible(viewer, candidate)) continue;
    const taste = getTaste(candidate);
    if (!taste) continue;
    const breakdown = scoreCompatibility(viewerTaste, taste);
    if (breakdown.dealbreakerHit) continue;
    scored.push({ profile: candidate, taste, breakdown });
  }

  scored.sort((a, b) => b.breakdown.total - a.breakdown.total);
  return scored;
}

/** Convenience: score a single pair (used in tests/utilities). */
export function scorePair(a: Profile, b: Profile): ScoreBreakdown | null {
  const ta = getTaste(a);
  const tb = getTaste(b);
  if (!ta || !tb) return null;
  return scoreCompatibility(ta, tb);
}

export { canonicalPair, getTaste };
