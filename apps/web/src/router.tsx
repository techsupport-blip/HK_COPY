import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { RootLayout } from "./components/RootLayout";
import { LoginPage } from "./routes/login";
import { OnboardingPage } from "./routes/onboarding";
import { MatchesPage } from "./routes/matches";
import { MatchDetailPage } from "./routes/match-detail";
import { ConversationsPage } from "./routes/conversations";
import { ChatPage } from "./routes/chat";
import { ProfilePage } from "./routes/profile";

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/matches" });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: OnboardingPage,
});

const matchesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/matches",
  component: MatchesPage,
});

const matchDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/matches/$matchId",
  component: MatchDetailPage,
});

const conversationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chats",
  component: ConversationsPage,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chats/$conversationId",
  component: ChatPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  onboardingRoute,
  matchesRoute,
  matchDetailRoute,
  conversationsRoute,
  chatRoute,
  profileRoute,
]);

// The standalone demo is served as a single file from a CDN, so use hash
// history (paths in the URL fragment) — robust on any static host.
const isDemo = import.meta.env.MODE === "demo";

export const router = createRouter({
  routeTree,
  ...(isDemo ? { history: createHashHistory() } : {}),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
