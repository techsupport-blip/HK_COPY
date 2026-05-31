import {
  scoreCompatibility,
  type ActivityDTO,
  type ConversationDTO,
  type InterviewReplyResponse,
  type InterviewStateResponse,
  type MatchDetailDTO,
  type MatchState,
  type MatchSummaryDTO,
  type MeResponse,
  type MessageDTO,
  type ProfileDTO,
  type ScoreBreakdownDTO,
  type UpdateProfileRequest,
  type WingmanResponse,
} from "@hearth/shared";
import { ApiClient, createMemoryTokenStorage } from "@hearth/client";
import {
  DEMO_CANDIDATES,
  DEMO_USER,
  profileOf,
  tasteOf,
  type DemoPerson,
} from "./data";

interface MatchRecord {
  id: string;
  other: DemoPerson;
  score: number;
  breakdown: ScoreBreakdownDTO;
  rationale: string;
  myState: MatchState;
  mutual: boolean;
  conversationId: string | null;
  activities: ActivityDTO[] | null;
}

interface MessageRecord {
  id: string;
  conversationId: string;
  senderId: string | null;
  content: string;
  createdAt: string;
  mine: boolean;
}

const MOCK_QUESTIONS = [
  "To start — what does a genuinely good weekend look like for you?",
  "Love that. What's something you could talk about for hours?",
  "When you picture clicking with someone, what value matters most to you?",
  "Are you more recharge-at-home or out-and-about with your energy?",
  "What's an ideal low-key first date in your mind?",
  "Last one — is there anything that's an absolute dealbreaker for you?",
];

function teaser(text: string): string {
  const first = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return first.length > 140 ? first.slice(0, 137) + "…" : first;
}

let counter = 0;
const id = (p: string) => `${p}-${++counter}`;

/**
 * A fully in-browser stand-in for the real API. Implements the same surface the
 * UI uses, backed by in-memory seed data and the shared compatibility engine —
 * so the demo build needs no backend, no key, and no sign-in.
 */
export class MockApiClient extends ApiClient {
  private profile: ProfileDTO;
  private matchRecords: MatchRecord[] = [];
  private messageStore: MessageRecord[] = [];
  private interviewTurns: { role: "assistant" | "user"; content: string }[] = [];
  private interviewDone = true;

  constructor() {
    super({ baseUrl: "", storage: createMemoryTokenStorage() });
    this.profile = profileOf(DEMO_USER, true);
    this.buildMatches();
    this.seedMutualChat();
  }

  private buildMatches() {
    const demoTaste = tasteOf(DEMO_USER);
    this.matchRecords = DEMO_CANDIDATES.map((other) => {
      const breakdown = scoreCompatibility(demoTaste, tasteOf(other));
      return {
        id: `match-${other.userId}`,
        other,
        score: breakdown.total,
        breakdown: {
          interests: breakdown.interests,
          values: breakdown.values,
          personality: breakdown.personality,
          energy: breakdown.energy,
          total: breakdown.total,
        },
        rationale: this.rationaleFor(other),
        myState: "pending" as MatchState,
        mutual: false,
        conversationId: null,
        activities: null,
      };
    }).sort((a, b) => b.score - a.score);
  }

  private rationaleFor(other: DemoPerson): string {
    const shared = DEMO_USER.interests.find((i) => other.interests.includes(i));
    if (other.userId === "marco") {
      return "You both orbit the same world — trailheads, pour-over coffee, and a camera always within reach. Marco's easygoing adventurousness is a natural match for your curious, golden-hour energy.";
    }
    return `You two share a similar outlook${
      shared ? ` and a real love of ${shared}` : ""
    } — there's a natural, easy spark worth exploring here.`;
  }

  private seedMutualChat() {
    const marco = this.matchRecords.find((m) => m.other.userId === "marco");
    if (!marco) return;
    marco.myState = "liked";
    marco.mutual = true;
    marco.conversationId = "convo-marco";
    this.messageStore.push({
      id: id("msg"),
      conversationId: "convo-marco",
      senderId: "marco",
      content:
        "Okay I have to ask — best trail-coffee setup you've used? I'm very serious about this.",
      createdAt: new Date().toISOString(),
      mine: false,
    });
  }

  private summary(m: MatchRecord): MatchSummaryDTO {
    return {
      id: m.id,
      otherUserId: m.other.userId,
      displayName: m.other.displayName,
      age: m.other.age,
      city: m.other.city,
      photoUrls: profileOf(m.other).photoUrls,
      interests: m.other.interests,
      compatibilityScore: m.score,
      rationaleTeaser: teaser(m.rationale),
      myState: m.myState,
      mutual: m.mutual,
    };
  }

  /* ----------------------------- Auth ----------------------------- */
  override isAuthenticated(): boolean {
    return true;
  }
  override async login(): Promise<void> {}
  override async register(): Promise<void> {}
  override async logout(): Promise<void> {}

  /* ---------------------------- Profile --------------------------- */
  override async me(): Promise<MeResponse> {
    return { id: "demo", email: "demo@hearth.app", profile: this.profile };
  }

  override async updateProfile(body: UpdateProfileRequest): Promise<ProfileDTO> {
    this.profile = {
      ...this.profile,
      ...(body.displayName !== undefined && { displayName: body.displayName }),
      ...(body.age !== undefined && { age: body.age }),
      ...(body.gender !== undefined && { gender: body.gender }),
      ...(body.seekingGenders !== undefined && { seekingGenders: body.seekingGenders }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.city !== undefined && { city: body.city }),
    };
    return this.profile;
  }

  /* --------------------------- Interview -------------------------- */
  override async startInterview(): Promise<InterviewReplyResponse> {
    this.interviewTurns = [{ role: "assistant", content: MOCK_QUESTIONS[0]! }];
    this.interviewDone = false;
    return { status: "in_progress", question: MOCK_QUESTIONS[0]!, done: false, tasteProfileSummary: null };
  }

  override async interviewState(): Promise<InterviewStateResponse> {
    return {
      status: this.interviewDone ? "complete" : "in_progress",
      turns: this.interviewTurns.map((t, i) => ({ ...t, order: i })),
      tasteProfileSummary: this.interviewDone ? this.profile.tasteProfileSummary : null,
    };
  }

  override async submitInterviewTurn(content: string): Promise<InterviewReplyResponse> {
    this.interviewTurns.push({ role: "user", content });
    const answered = this.interviewTurns.filter((t) => t.role === "user").length;
    if (answered >= MOCK_QUESTIONS.length) {
      this.interviewDone = true;
      this.profile = { ...this.profile, onboardingComplete: true };
      return { status: "complete", question: null, done: true, tasteProfileSummary: this.profile.tasteProfileSummary };
    }
    const q = MOCK_QUESTIONS[answered]!;
    this.interviewTurns.push({ role: "assistant", content: q });
    return { status: "in_progress", question: q, done: false, tasteProfileSummary: null };
  }

  override async completeInterview(): Promise<InterviewReplyResponse> {
    this.interviewDone = true;
    return { status: "complete", question: null, done: true, tasteProfileSummary: this.profile.tasteProfileSummary };
  }

  /* ---------------------------- Matches --------------------------- */
  override async generateMatches(): Promise<{ created: number }> {
    return { created: this.matchRecords.length };
  }

  override async matches(): Promise<MatchSummaryDTO[]> {
    return this.matchRecords.filter((m) => m.myState !== "passed").map((m) => this.summary(m));
  }

  override async match(matchId: string): Promise<MatchDetailDTO> {
    const m = this.find(matchId);
    return {
      ...this.summary(m),
      bio: m.other.bio,
      rationale: m.rationale,
      scoreBreakdown: m.breakdown,
      tasteProfileSummary: m.other.summary,
      conversationId: m.conversationId,
    };
  }

  override async likeMatch(matchId: string) {
    const m = this.find(matchId);
    m.myState = "liked";
    if (m.other.likesBack) {
      m.mutual = true;
      m.conversationId = m.conversationId ?? `convo-${m.other.userId}`;
    }
    return { mutual: m.mutual, conversationId: m.conversationId };
  }

  override async passMatch(matchId: string) {
    const m = this.find(matchId);
    m.myState = "passed";
    return { mutual: false, conversationId: null };
  }

  override async activities(matchId: string): Promise<ActivityDTO[]> {
    const m = this.find(matchId);
    if (m.activities) return m.activities;
    const shared =
      DEMO_USER.interests.find((i) => m.other.interests.includes(i)) ?? "a good chat";
    const city = m.other.city;
    m.activities = [
      {
        id: id("act"),
        title: "Slow coffee & a wander",
        description: `Grab a relaxed coffee in ${city} and see where the conversation goes.`,
        category: "coffee",
        rationale: `A low-pressure way to connect over your shared love of ${shared}.`,
        mockVenueName: "The Hearth Room Café",
      },
      {
        id: id("act"),
        title: "Golden-hour walk",
        description: `An easy stroll through a green spot in ${city} as the light gets good.`,
        category: "outdoors",
        rationale: "You both lean toward being out and about — movement makes talking easy.",
        mockVenueName: "Riverside Commons",
      },
      {
        id: id("act"),
        title: "Gallery + small bites",
        description: `Wander a local exhibit in ${city}, then split a few plates nearby.`,
        category: "culture",
        rationale: `Plenty to react to together, building on your interest in ${shared}.`,
        mockVenueName: "Northside Art Lab",
      },
    ];
    return m.activities;
  }

  /* -------------------------- Conversations ----------------------- */
  override async conversations(): Promise<ConversationDTO[]> {
    return this.matchRecords
      .filter((m) => m.mutual && m.conversationId)
      .map((m) => ({
        id: m.conversationId!,
        matchId: m.id,
        otherUserId: m.other.userId,
        otherDisplayName: m.other.displayName,
        otherPhotoUrls: profileOf(m.other).photoUrls,
        lastMessageAt:
          this.messageStore.filter((x) => x.conversationId === m.conversationId).at(-1)?.createdAt ??
          null,
      }));
  }

  override async messages(conversationId: string): Promise<MessageDTO[]> {
    return this.messageStore
      .filter((m) => m.conversationId === conversationId)
      .map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        kind: "user",
        content: m.content,
        createdAt: m.createdAt,
        mine: m.mine,
      }));
  }

  override async sendMessage(conversationId: string, content: string): Promise<MessageDTO> {
    const rec: MessageRecord = {
      id: id("msg"),
      conversationId,
      senderId: "demo",
      content,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    this.messageStore.push(rec);
    // A friendly canned reply so the demo conversation feels alive.
    setTimeout(() => {
      this.messageStore.push({
        id: id("msg"),
        conversationId,
        senderId: "other",
        content: "Ha, I love that. Okay — when are you free this week? ☕",
        createdAt: new Date().toISOString(),
        mine: false,
      });
    }, 1400);
    return { id: rec.id, conversationId, senderId: "demo", kind: "user", content, createdAt: rec.createdAt, mine: true };
  }

  override async wingmanOpeners(): Promise<WingmanResponse> {
    return {
      suggestions: [
        "Okay, I have to ask about hiking — how did you get into it?",
        "Your profile made me smile. What's been the highlight of your week? Maybe a slow coffee sometime?",
        "I have a feeling we'd run out of time before we run out of things to talk about. What's your ideal Saturday?",
      ],
    };
  }

  override async wingmanAssist(): Promise<WingmanResponse> {
    return {
      suggestions: [
        "That's so my kind of thing — tell me more.",
        "Honestly, this is fun. Want to continue it over coffee this week?",
        "You're easy to talk to. What does your weekend look like?",
      ],
    };
  }

  private find(matchId: string): MatchRecord {
    const m = this.matchRecords.find((x) => x.id === matchId);
    if (!m) throw new Error("Match not found");
    return m;
  }
}
