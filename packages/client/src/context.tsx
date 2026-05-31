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

type ApiProviderProps = { children: ReactNode } & (
  | ApiClientOptions
  /** Inject a pre-built client (e.g. an in-browser mock for the demo build). */
  | { client: ApiClient; onLogout?: () => void }
);

export function ApiProvider({ children, ...props }: ApiProviderProps) {
  const injected = "client" in props ? props.client : null;

  const [isAuthenticated, setAuthenticated] = useState(() =>
    injected
      ? injected.isAuthenticated()
      : (props as ApiClientOptions).storage.getAccess() != null,
  );

  const client = useMemo(
    () =>
      injected ??
      new ApiClient({
        ...(props as ApiClientOptions),
        onLogout: () => {
          setAuthenticated(false);
          props.onLogout?.();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [injected],
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
