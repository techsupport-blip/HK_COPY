import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LoginRequest, RegisterRequest } from "@hearth/shared";
import { ApiClient, type ApiClientOptions } from "./api.js";

interface AuthContextValue {
  client: ApiClient;
  isAuthenticated: boolean;
  login: (body: LoginRequest) => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const ApiContext = createContext<AuthContextValue | null>(null);

export function ApiProvider({
  children,
  ...options
}: ApiClientOptions & { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(() => {
    return options.storage.getAccess() != null;
  });

  const client = useMemo(
    () =>
      new ApiClient({
        ...options,
        onLogout: () => {
          setAuthenticated(false);
          options.onLogout?.();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.baseUrl],
  );

  const login = useCallback(
    async (body: LoginRequest) => {
      await client.login(body);
      setAuthenticated(true);
    },
    [client],
  );

  const register = useCallback(
    async (body: RegisterRequest) => {
      await client.register(body);
      setAuthenticated(true);
    },
    [client],
  );

  const logout = useCallback(async () => {
    await client.logout();
    setAuthenticated(false);
  }, [client]);

  const value = useMemo(
    () => ({ client, isAuthenticated, login, register, logout }),
    [client, isAuthenticated, login, register, logout],
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useAuth must be used within an ApiProvider");
  return ctx;
}

export function useApiClient(): ApiClient {
  return useAuth().client;
}
