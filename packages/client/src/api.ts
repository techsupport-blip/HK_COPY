import type {
  ActivityDTO,
  AuthTokens,
  ConversationDTO,
  InterviewReplyResponse,
  InterviewStateResponse,
  LoginRequest,
  MatchDetailDTO,
  MatchSummaryDTO,
  MeResponse,
  MessageDTO,
  RegisterRequest,
  UpdateProfileRequest,
  WingmanResponse,
} from "@hearth/shared";
import type { TokenStorage } from "./storage.js";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  storage: TokenStorage;
  /** Called when refresh fails and the session is cleared. */
  onLogout?: () => void;
}

/**
 * Typed fetch wrapper. Attaches the access token, and on a 401 transparently
 * tries the refresh token once before retrying the original request.
 */
export class ApiClient {
  private refreshing: Promise<boolean> | null = null;

  constructor(private opts: ApiClientOptions) {}

  get storage(): TokenStorage {
    return this.opts.storage;
  }

  isAuthenticated(): boolean {
    return this.opts.storage.getAccess() != null;
  }

  private async raw<T>(
    method: string,
    path: string,
    body?: unknown,
    auth = true,
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth) {
      const token = this.opts.storage.getAccess();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${this.opts.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      throw new ApiError(
        res.status,
        data?.error ?? "error",
        data?.message ?? res.statusText,
      );
    }
    return data as T;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    try {
      return await this.raw<T>(method, path, body, true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const ok = await this.tryRefresh();
        if (ok) return this.raw<T>(method, path, body, true);
        this.opts.storage.clear();
        this.opts.onLogout?.();
      }
      throw err;
    }
  }

  private async tryRefresh(): Promise<boolean> {
    if (this.refreshing) return this.refreshing;
    const refreshToken = this.opts.storage.getRefresh();
    if (!refreshToken) return false;
    this.refreshing = (async () => {
      try {
        const tokens = await this.raw<AuthTokens>(
          "POST",
          "/auth/refresh",
          { refreshToken },
          false,
        );
        this.opts.storage.set(tokens);
        return true;
      } catch {
        return false;
      } finally {
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  /* ----------------------------- Auth ----------------------------- */

  async register(body: RegisterRequest): Promise<void> {
    const tokens = await this.raw<AuthTokens>("POST", "/auth/register", body, false);
    this.opts.storage.set(tokens);
  }

  async login(body: LoginRequest): Promise<void> {
    const tokens = await this.raw<AuthTokens>("POST", "/auth/login", body, false);
    this.opts.storage.set(tokens);
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>("POST", "/auth/logout");
    } finally {
      this.opts.storage.clear();
      this.opts.onLogout?.();
    }
  }

  /* ---------------------------- Profile --------------------------- */

  me() {
    return this.request<MeResponse>("GET", "/me");
  }

  updateProfile(body: UpdateProfileRequest) {
    return this.request<MeResponse["profile"]>("PUT", "/me/profile", body);
  }

  /* --------------------------- Interview -------------------------- */

  startInterview() {
    return this.request<InterviewReplyResponse>("POST", "/interview/start");
  }

  interviewState() {
    return this.request<InterviewStateResponse>("GET", "/interview");
  }

  submitInterviewTurn(content: string) {
    return this.request<InterviewReplyResponse>("POST", "/interview/turn", { content });
  }

  completeInterview() {
    return this.request<InterviewReplyResponse>("POST", "/interview/complete");
  }

  /* ---------------------------- Matches --------------------------- */

  generateMatches() {
    return this.request<{ created: number }>("POST", "/matches/generate");
  }

  matches() {
    return this.request<MatchSummaryDTO[]>("GET", "/matches");
  }

  match(id: string) {
    return this.request<MatchDetailDTO>("GET", `/matches/${id}`);
  }

  likeMatch(id: string) {
    return this.request<{ mutual: boolean; conversationId: string | null }>(
      "POST",
      `/matches/${id}/like`,
    );
  }

  passMatch(id: string) {
    return this.request<{ mutual: boolean; conversationId: string | null }>(
      "POST",
      `/matches/${id}/pass`,
    );
  }

  activities(matchId: string) {
    return this.request<ActivityDTO[]>("GET", `/matches/${matchId}/activities`);
  }

  /* -------------------------- Conversations ----------------------- */

  conversations() {
    return this.request<ConversationDTO[]>("GET", "/conversations");
  }

  messages(conversationId: string) {
    return this.request<MessageDTO[]>("GET", `/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId: string, content: string) {
    return this.request<MessageDTO>(
      "POST",
      `/conversations/${conversationId}/messages`,
      { content },
    );
  }

  wingmanOpeners(conversationId: string) {
    return this.request<WingmanResponse>(
      "POST",
      `/conversations/${conversationId}/wingman/openers`,
    );
  }

  wingmanAssist(conversationId: string) {
    return this.request<WingmanResponse>(
      "POST",
      `/conversations/${conversationId}/wingman/assist`,
    );
  }
}
