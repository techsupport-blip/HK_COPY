import type { MatchDetailDTO, MatchState, MatchSummaryDTO } from "@hearth/shared";
import { prisma } from "../lib/prisma.js";
import { forbidden, notFound } from "../lib/errors.js";
import { matchPerspective, toMatchDetailDTO, toMatchSummaryDTO } from "../lib/dto.js";

/** Today's curated matches the viewer hasn't passed on, best first. */
export async function listMatches(userId: string): Promise<MatchSummaryDTO[]> {
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { compatibilityScore: "desc" },
  });

  const result: MatchSummaryDTO[] = [];
  for (const match of matches) {
    const { otherUserId, myState } = matchPerspective(match, userId);
    if ((myState as MatchState) === "passed") continue;
    const otherProfile = await prisma.profile.findUnique({
      where: { userId: otherUserId },
    });
    if (!otherProfile) continue;
    result.push(toMatchSummaryDTO(match, otherProfile, userId));
  }
  return result;
}

export async function getMatchDetail(
  userId: string,
  matchId: string,
): Promise<MatchDetailDTO> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { conversation: true },
  });
  if (!match) throw notFound("Match not found");
  if (match.userAId !== userId && match.userBId !== userId) {
    throw forbidden("Not your match");
  }
  const { otherUserId } = matchPerspective(match, userId);
  const otherProfile = await prisma.profile.findUnique({
    where: { userId: otherUserId },
  });
  if (!otherProfile) throw notFound("Match profile missing");
  return toMatchDetailDTO(match, otherProfile, userId);
}
