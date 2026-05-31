/**
 * Matches are stored canonically with userAId < userBId so each unordered pair
 * maps to exactly one row (enforced by a unique constraint).
 */
export function canonicalPair(idA: string, idB: string) {
  return idA < idB
    ? { userAId: idA, userBId: idB }
    : { userAId: idB, userBId: idA };
}

/** Today's batch key (YYYY-MM-DD), used to group a user's daily matches. */
export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
