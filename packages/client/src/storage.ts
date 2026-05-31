import type { AuthTokens } from "@hearth/shared";

/**
 * Pluggable token storage so the same API client works on web (localStorage)
 * and mobile (e.g. SecureStore / AsyncStorage).
 */
export interface TokenStorage {
  getAccess(): string | null;
  getRefresh(): string | null;
  set(tokens: AuthTokens): void;
  clear(): void;
}

/** Browser localStorage-backed implementation. */
export function createLocalStorageTokenStorage(
  keyPrefix = "hearth",
): TokenStorage {
  const accessKey = `${keyPrefix}.access`;
  const refreshKey = `${keyPrefix}.refresh`;
  return {
    getAccess: () => localStorage.getItem(accessKey),
    getRefresh: () => localStorage.getItem(refreshKey),
    set: (tokens) => {
      localStorage.setItem(accessKey, tokens.accessToken);
      localStorage.setItem(refreshKey, tokens.refreshToken);
    },
    clear: () => {
      localStorage.removeItem(accessKey);
      localStorage.removeItem(refreshKey);
    },
  };
}

/** In-memory implementation (tests, or a fallback). */
export function createMemoryTokenStorage(): TokenStorage {
  let access: string | null = null;
  let refresh: string | null = null;
  return {
    getAccess: () => access,
    getRefresh: () => refresh,
    set: (tokens) => {
      access = tokens.accessToken;
      refresh = tokens.refreshToken;
    },
    clear: () => {
      access = null;
      refresh = null;
    },
  };
}
