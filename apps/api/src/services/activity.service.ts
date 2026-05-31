import type { ActivityDTO } from "@hearth/shared";
import { prisma } from "../lib/prisma.js";
import { forbidden, notFound } from "../lib/errors.js";
import { getAi } from "../ai/client.js";
import { toActivityDTO } from "../lib/dto.js";
import { toProfileLite } from "./matchmaker.service.js";

/**
 * Activity suggestions are generated lazily the first time a match detail is
 * opened, then cached as rows so we never re-bill the AI for the same match.
 */
export async function getActivitiesForMatch(
  userId: string,
  matchId: string,
): Promise<ActivityDTO[]> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { activities: { orderBy: { order: "asc" } } },
  });
  if (!match) throw notFound("Match not found");
  if (match.userAId !== userId && match.userBId !== userId) {
    throw forbidden("Not your match");
  }

  if (match.activities.length > 0) {
    return match.activities.map(toActivityDTO);
  }

  const [profileA, profileB] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: match.userAId } }),
    prisma.profile.findUnique({ where: { userId: match.userBId } }),
  ]);
  if (!profileA || !profileB) throw notFound("Match profiles missing");

  const ai = getAi();
  const out = await ai.suggestActivities({
    a: toProfileLite(profileA),
    b: toProfileLite(profileB),
    city: profileA.city ?? profileB.city ?? "town",
  });

  const created = await prisma.$transaction(
    out.activities.map((a, i) =>
      prisma.activitySuggestion.create({
        data: {
          matchId: match.id,
          title: a.title,
          description: a.description,
          category: a.category,
          rationale: a.rationale,
          mockVenueName: a.mockVenueName,
          order: i,
        },
      }),
    ),
  );

  return created.map(toActivityDTO);
}
