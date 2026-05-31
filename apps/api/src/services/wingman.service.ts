import type { WingmanResponse } from "@hearth/shared";
import { prisma } from "../lib/prisma.js";
import { forbidden, notFound } from "../lib/errors.js";
import { getAi } from "../ai/client.js";
import { toProfileLite } from "./matchmaker.service.js";

const RECENT_MESSAGE_WINDOW = 10;

async function loadConversationContext(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { match: { include: { activities: { orderBy: { order: "asc" } } } } },
  });
  if (!conversation) throw notFound("Conversation not found");
  const { match } = conversation;
  if (match.userAId !== userId && match.userBId !== userId) {
    throw forbidden("Not your conversation");
  }
  const otherUserId = match.userAId === userId ? match.userBId : match.userAId;
  const otherProfile = await prisma.profile.findUnique({
    where: { userId: otherUserId },
  });
  if (!otherProfile) throw notFound("Match profile missing");
  return {
    conversation,
    match,
    otherProfile,
    activityTitle: match.activities[0]?.title,
  };
}

/** Suggested first messages for a new match. */
export async function wingmanOpeners(
  userId: string,
  conversationId: string,
): Promise<WingmanResponse> {
  const ctx = await loadConversationContext(userId, conversationId);
  const ai = getAi();
  const out = await ai.wingmanOpeners({
    other: toProfileLite(ctx.otherProfile),
    activityTitle: ctx.activityTitle,
  });
  return { suggestions: out.suggestions };
}

/** Reply suggestions based on the recent conversation, nudging toward meeting. */
export async function wingmanAssist(
  userId: string,
  conversationId: string,
): Promise<WingmanResponse> {
  const ctx = await loadConversationContext(userId, conversationId);
  const recent = await prisma.message.findMany({
    where: { conversationId, kind: "user" },
    orderBy: { createdAt: "desc" },
    take: RECENT_MESSAGE_WINDOW,
  });
  const ai = getAi();
  const out = await ai.wingmanAssist({
    other: toProfileLite(ctx.otherProfile),
    activityTitle: ctx.activityTitle,
    recentMessages: recent
      .reverse()
      .map((m) => ({ mine: m.senderId === userId, content: m.content })),
  });
  return { suggestions: out.suggestions };
}
