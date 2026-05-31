import {
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  onboardingRoute,
  matchesRoute,
  matchDetailRoute,
  conversationsRoute,
  chatRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
