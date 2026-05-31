import type {
  ConversationDTO,
  MatchState,
  MessageDTO,
} from "@hearth/shared";
import { prisma } from "../lib/prisma.js";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { matchPerspective, toConversationDTO, toMessageDTO } from "../lib/dto.js";

/**
 * Record a like/pass from the viewer. When both sides have liked, mark the match
 * mutual and open a conversation.
 */
export async function actOnMatch(
  userId: string,
  matchId: string,
  action: "like" | "pass",
): Promise<{ mutual: boolean; conversationId: string | null }> {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw notFound("Match not found");
  const isA = match.userAId === userId;
  const isB = match.userBId === userId;
  if (!isA && !isB) throw forbidden("Not your match");

  const newState: MatchState = action === "like" ? "liked" : "passed";
  const otherState = (isA ? match.userBState : match.userAState) as MatchState;
  const mutual = newState === "liked" && otherState === "liked";

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      ...(isA ? { userAState: newState } : { userBState: newState }),
      mutual,
    },
  });

  let conversationId: string | null = null;
  if (mutual) {
    const convo = await prisma.conversation.upsert({
      where: { matchId },
      create: { matchId },
      update: {},
    });
    conversationId = convo.id;
  }

  return { mutual: updated.mutual, conversationId };
}

export async function listConversations(
  userId: string,
): Promise<ConversationDTO[]> {
  const conversations = await prisma.conversation.findMany({
    where: {
      match: { OR: [{ userAId: userId }, { userBId: userId }] },
    },
    include: { match: true },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
  });

  const result: ConversationDTO[] = [];
  for (const convo of conversations) {
    const { otherUserId } = matchPerspective(convo.match, userId);
    const otherProfile = await prisma.profile.findUnique({
      where: { userId: otherUserId },
    });
    if (!otherProfile) continue;
    result.push(toConversationDTO(convo, convo.match, otherProfile));
  }
  return result;
}

async function assertParticipant(userId: string, conversationId: string) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { match: true },
  });
  if (!convo) throw notFound("Conversation not found");
  if (convo.match.userAId !== userId && convo.match.userBId !== userId) {
    throw forbidden("Not your conversation");
  }
  return convo;
}

export async function listMessages(
  userId: string,
  conversationId: string,
): Promise<MessageDTO[]> {
  await assertParticipant(userId, conversationId);
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  return messages.map((m) => toMessageDTO(m, userId));
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  content: string,
): Promise<MessageDTO> {
  const convo = await assertParticipant(userId, conversationId);
  if (!convo.match.mutual) {
    throw badRequest("You can only message a mutual match");
  }
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: userId, kind: "user", content },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);
  return toMessageDTO(message!, userId);
}
