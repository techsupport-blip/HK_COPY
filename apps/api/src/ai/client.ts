import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { env } from "../env.js";
import {
  ACTIVITIES_SYSTEM,
  EXTRACTION_SYSTEM,
  INTERVIEWER_SYSTEM,
  MATCHMAKER_SYSTEM,
  WINGMAN_ASSIST_SYSTEM,
  WINGMAN_OPENERS_SYSTEM,
} from "./prompts.js";
import {
  ActivitiesOutput,
  NextQuestionOutput,
  RerankOutput,
  SuggestionsOutput,
  TasteExtractionOutput,
} from "./schemas.js";

export interface TranscriptTurn {
  role: "assistant" | "user";
  content: string;
}

export interface CandidateInput {
  candidateUserId: string;
  summary: string;
  subscore: number;
}

export interface ProfileLite {
  displayName: string;
  interests: string[];
  summary: string;
}

export interface ActivitiesInput {
  a: ProfileLite;
  b: ProfileLite;
  city: string;
}

export interface WingmanInput {
  /** Profile of the person being messaged. */
  other: ProfileLite;
  /** Recent transcript (for assist) — newest last. */
  recentMessages?: { mine: boolean; content: string }[];
  /** Optional activity title to weave in. */
  activityTitle?: string;
}

/** The capabilities every provider implements. */
export interface AiProvider {
  nextInterviewQuestion(transcript: TranscriptTurn[]): Promise<NextQuestionOutput>;
  extractTasteProfile(transcript: TranscriptTurn[]): Promise<TasteExtractionOutput>;
  rerankMatches(
    viewerSummary: string,
    candidates: CandidateInput[],
  ): Promise<RerankOutput>;
  suggestActivities(input: ActivitiesInput): Promise<ActivitiesOutput>;
  wingmanOpeners(input: WingmanInput): Promise<SuggestionsOutput>;
  wingmanAssist(input: WingmanInput): Promise<SuggestionsOutput>;
}

/* ----------------------------------------------------------------------------
 * Mock provider — deterministic, no network, no key. Powers demos and CI.
 * ------------------------------------------------------------------------- */

const MOCK_QUESTIONS = [
  "To start — what does a genuinely good weekend look like for you?",
  "Love that. What's something you could talk about for hours?",
  "When you picture clicking with someone, what value matters most to you?",
  "Are you more recharge-at-home or out-and-about with your energy?",
  "What's an ideal low-key first date in your mind?",
  "Last one — is there anything that's an absolute dealbreaker for you?",
];

const STOPWORDS = new Set([
  "the", "and", "a", "an", "to", "of", "i", "you", "is", "it", "for", "in",
  "on", "with", "my", "me", "really", "like", "love", "good", "about", "that",
  "this", "have", "would", "more", "some", "what", "when", "your",
]);

function keywords(text: string, max: number): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, max);
}

class MockProvider implements AiProvider {
  async nextInterviewQuestion(
    transcript: TranscriptTurn[],
  ): Promise<NextQuestionOutput> {
    const userAnswers = transcript.filter((t) => t.role === "user").length;
    if (userAnswers >= MOCK_QUESTIONS.length) {
      return { done: true, question: null };
    }
    return { done: false, question: MOCK_QUESTIONS[userAnswers]! };
  }

  async extractTasteProfile(
    transcript: TranscriptTurn[],
  ): Promise<TasteExtractionOutput> {
    const userText = transcript
      .filter((t) => t.role === "user")
      .map((t) => t.content)
      .join(" ");
    const interests = keywords(userText, 8);
    return {
      interests: interests.length ? interests : ["conversation", "exploring"],
      values: ["authenticity", "kindness"],
      personalityTraits: {
        introversion: 0.5,
        adventurousness: 0.6,
        warmth: 0.7,
        ambition: 0.55,
        playfulness: 0.6,
      },
      dealbreakers: [],
      idealDateVibe: "relaxed and genuine",
      energyLevel: "medium",
      summary:
        "A warm, curious person who values genuine connection and enjoys " +
        (interests.slice(0, 3).join(", ") || "good conversation") +
        ". Looking for someone easy to be themselves around.",
    };
  }

  async rerankMatches(
    _viewerSummary: string,
    candidates: CandidateInput[],
  ): Promise<RerankOutput> {
    return {
      results: candidates.map((c) => ({
        candidateUserId: c.candidateUserId,
        adjustedScore: c.subscore,
        rationale:
          "You two share a similar outlook and overlapping interests — there's a natural, easy spark to explore here.",
      })),
    };
  }

  async suggestActivities(input: ActivitiesInput): Promise<ActivitiesOutput> {
    const shared =
      input.a.interests.find((i) => input.b.interests.includes(i)) ??
      input.a.interests[0] ??
      "a good chat";
    const city = input.city || "your area";
    return {
      activities: [
        {
          title: "Slow coffee & a wander",
          description: `Grab a relaxed coffee in ${city} and see where the conversation goes.`,
          category: "coffee",
          rationale: `A low-pressure way to connect over your shared love of ${shared}.`,
          mockVenueName: "The Hearth Room Café",
        },
        {
          title: "Golden-hour walk",
          description: `An easy stroll through a green spot in ${city} as the light gets good.`,
          category: "outdoors",
          rationale: "You both lean toward being out and about — movement makes talking easy.",
          mockVenueName: "Riverside Commons",
        },
        {
          title: "Gallery + small bites",
          description: `Wander a local exhibit in ${city}, then split a few plates nearby.`,
          category: "culture",
          rationale: `Plenty to react to together, building on your interest in ${shared}.`,
          mockVenueName: "Northside Art Lab",
        },
      ],
    };
  }

  async wingmanOpeners(input: WingmanInput): Promise<SuggestionsOutput> {
    const interest = input.other.interests[0] ?? "what you're into";
    const activity = input.activityTitle ? ` Maybe ${input.activityTitle.toLowerCase()} sometime?` : "";
    return {
      suggestions: [
        `Okay, I have to ask about ${interest} — how did you get into it?`,
        `Your profile made me smile. What's been the highlight of your week?${activity}`,
        `I have a feeling we'd run out of time before we run out of things to talk about. What's your ideal Saturday?`,
      ],
    };
  }

  async wingmanAssist(input: WingmanInput): Promise<SuggestionsOutput> {
    const activity = input.activityTitle ?? "grabbing a coffee";
    return {
      suggestions: [
        "That's so my kind of thing — tell me more.",
        `Honestly, this is fun. Want to continue it over ${activity} this week?`,
        "You're easy to talk to. What does your weekend look like?",
      ],
    };
  }
}

/* ----------------------------------------------------------------------------
 * Anthropic provider — real Claude with prompt caching on system prompts.
 * ------------------------------------------------------------------------- */

class AnthropicProvider implements AiProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    this.model = env.ANTHROPIC_MODEL;
  }

  private async callJson<T>(
    system: string,
    userContent: string,
    schema: z.ZodType<T>,
    maxTokens = 1024,
  ): Promise<T> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      // Cache the (stable) system prompt to cut input cost across calls.
      system: [
        { type: "text", text: system, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userContent }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return schema.parse(extractJson(text));
  }

  nextInterviewQuestion(transcript: TranscriptTurn[]) {
    return this.callJson(
      INTERVIEWER_SYSTEM,
      `Conversation so far:\n${renderTranscript(transcript)}\n\nReturn the next question JSON.`,
      NextQuestionOutput,
      512,
    );
  }

  extractTasteProfile(transcript: TranscriptTurn[]) {
    return this.callJson(
      EXTRACTION_SYSTEM,
      `Transcript:\n${renderTranscript(transcript)}\n\nReturn the taste profile JSON.`,
      TasteExtractionOutput,
      1024,
    );
  }

  rerankMatches(viewerSummary: string, candidates: CandidateInput[]) {
    const candidateBlock = candidates
      .map(
        (c) =>
          `- candidateUserId: ${c.candidateUserId}\n  subscore: ${c.subscore}\n  profile: ${c.summary}`,
      )
      .join("\n");
    return this.callJson(
      MATCHMAKER_SYSTEM,
      `Requesting user:\n${viewerSummary}\n\nCandidates:\n${candidateBlock}\n\nReturn the reranked JSON.`,
      RerankOutput,
      1536,
    );
  }

  suggestActivities(input: ActivitiesInput) {
    return this.callJson(
      ACTIVITIES_SYSTEM,
      `Person A interests: ${input.a.interests.join(", ")}\nPerson B interests: ${input.b.interests.join(
        ", ",
      )}\nCity: ${input.city}\n\nReturn the activities JSON.`,
      ActivitiesOutput,
      1024,
    );
  }

  wingmanOpeners(input: WingmanInput) {
    return this.callJson(
      WINGMAN_OPENERS_SYSTEM,
      `Match profile: ${input.other.summary}\nTheir interests: ${input.other.interests.join(
        ", ",
      )}\n${input.activityTitle ? `Suggested activity: ${input.activityTitle}\n` : ""}\nReturn opener suggestions JSON.`,
      SuggestionsOutput,
      768,
    );
  }

  wingmanAssist(input: WingmanInput) {
    const history = (input.recentMessages ?? [])
      .map((m) => `${m.mine ? "Me" : "Them"}: ${m.content}`)
      .join("\n");
    return this.callJson(
      WINGMAN_ASSIST_SYSTEM,
      `Match profile: ${input.other.summary}\n${
        input.activityTitle ? `Suggested activity: ${input.activityTitle}\n` : ""
      }Recent conversation:\n${history}\n\nReturn reply suggestions JSON.`,
      SuggestionsOutput,
      768,
    );
  }
}

function renderTranscript(transcript: TranscriptTurn[]): string {
  return transcript
    .map((t) => `${t.role === "assistant" ? "Hearth" : "User"}: ${t.content}`)
    .join("\n");
}

/** Extract a JSON object from model text, tolerating code fences / prose. */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1]! : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in model response");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

let provider: AiProvider | null = null;

/** Lazily construct the configured AI provider (mock by default). */
export function getAi(): AiProvider {
  if (!provider) {
    provider = env.AI_PROVIDER === "anthropic" ? new AnthropicProvider() : new MockProvider();
  }
  return provider;
}
