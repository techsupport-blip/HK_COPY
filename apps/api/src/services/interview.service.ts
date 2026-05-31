import type {
  InterviewReplyResponse,
  InterviewStateResponse,
  TasteProfile,
} from "@hearth/shared";
import { prisma } from "../lib/prisma.js";
import { badRequest } from "../lib/errors.js";
import { getAi, type TranscriptTurn } from "../ai/client.js";

async function loadTranscript(sessionId: string): Promise<TranscriptTurn[]> {
  const turns = await prisma.interviewTurn.findMany({
    where: { sessionId },
    orderBy: { order: "asc" },
  });
  return turns.map((t) => ({
    role: t.role as TranscriptTurn["role"],
    content: t.content,
  }));
}

async function appendTurn(
  sessionId: string,
  role: TranscriptTurn["role"],
  content: string,
  order: number,
) {
  await prisma.interviewTurn.create({
    data: { sessionId, role, content, order },
  });
}

/** Start (or resume) the onboarding interview and return the first/next question. */
export async function startInterview(
  userId: string,
): Promise<InterviewReplyResponse> {
  const existing = await prisma.interviewSession.findUnique({
    where: { userId },
    include: { turns: { orderBy: { order: "asc" } } },
  });

  if (existing && existing.turns.length > 0) {
    if (existing.status === "complete") {
      const profile = await prisma.profile.findUnique({ where: { userId } });
      return {
        status: "complete",
        question: null,
        done: true,
        tasteProfileSummary: profile?.tasteProfileSummary ?? null,
      };
    }
    const lastAssistant = [...existing.turns]
      .reverse()
      .find((t) => t.role === "assistant");
    return {
      status: "in_progress",
      question: lastAssistant?.content ?? null,
      done: false,
      tasteProfileSummary: null,
    };
  }

  const session =
    existing ??
    (await prisma.interviewSession.create({ data: { userId } }));

  const ai = getAi();
  const first = await ai.nextInterviewQuestion([]);
  const question = first.question ?? "Tell me a bit about yourself.";
  await appendTurn(session.id, "assistant", question, 0);

  return {
    status: "in_progress",
    question,
    done: false,
    tasteProfileSummary: null,
  };
}

/** Record the user's answer and produce the next question (or finish + extract). */
export async function submitTurn(
  userId: string,
  content: string,
): Promise<InterviewReplyResponse> {
  const session = await prisma.interviewSession.findUnique({
    where: { userId },
    include: { turns: { orderBy: { order: "asc" } } },
  });
  if (!session) throw badRequest("Interview not started");
  if (session.status === "complete") {
    throw badRequest("Interview already complete");
  }

  const nextOrder = session.turns.length;
  await appendTurn(session.id, "user", content, nextOrder);

  const transcript = await loadTranscript(session.id);
  const ai = getAi();
  const next = await ai.nextInterviewQuestion(transcript);

  if (!next.done && next.question) {
    await appendTurn(session.id, "assistant", next.question, nextOrder + 1);
    return {
      status: "in_progress",
      question: next.question,
      done: false,
      tasteProfileSummary: null,
    };
  }

  // Interview complete → extract structured taste profile.
  const summary = await finalizeInterview(userId, session.id, transcript);
  return {
    status: "complete",
    question: null,
    done: true,
    tasteProfileSummary: summary,
  };
}

/** Force completion + extraction (e.g. user taps "I'm done"). */
export async function completeInterview(userId: string): Promise<string> {
  const session = await prisma.interviewSession.findUnique({
    where: { userId },
  });
  if (!session) throw badRequest("Interview not started");
  const transcript = await loadTranscript(session.id);
  return finalizeInterview(userId, session.id, transcript);
}

async function finalizeInterview(
  userId: string,
  sessionId: string,
  transcript: TranscriptTurn[],
): Promise<string> {
  const ai = getAi();
  const extracted = await ai.extractTasteProfile(transcript);

  const tasteProfile: TasteProfile = {
    interests: extracted.interests,
    values: extracted.values,
    personalityTraits: extracted.personalityTraits,
    dealbreakers: extracted.dealbreakers,
    idealDateVibe: extracted.idealDateVibe,
    energyLevel: extracted.energyLevel,
  };

  await prisma.$transaction([
    prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: "complete" },
    }),
    prisma.profile.update({
      where: { userId },
      data: {
        tasteProfile: JSON.stringify(tasteProfile),
        tasteProfileSummary: extracted.summary,
        onboardingComplete: true,
      },
    }),
  ]);

  return extracted.summary;
}

export async function getInterviewState(
  userId: string,
): Promise<InterviewStateResponse> {
  const session = await prisma.interviewSession.findUnique({
    where: { userId },
    include: { turns: { orderBy: { order: "asc" } } },
  });
  if (!session) {
    return { status: "in_progress", turns: [], tasteProfileSummary: null };
  }
  const profile =
    session.status === "complete"
      ? await prisma.profile.findUnique({ where: { userId } })
      : null;
  return {
    status: session.status as InterviewStateResponse["status"],
    turns: session.turns.map((t) => ({
      role: t.role as "assistant" | "user",
      content: t.content,
      order: t.order,
    })),
    tasteProfileSummary: profile?.tasteProfileSummary ?? null,
  };
}
