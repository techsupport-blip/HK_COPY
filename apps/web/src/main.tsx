import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import {
  ApiProvider,
  createLocalStorageTokenStorage,
  type ApiClient,
} from "@hearth/client";
import { router } from "./router";
import { MockApiClient } from "./demo/mockClient";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

// In the standalone demo build there is no backend: swap in an in-browser mock
// client and auto-authenticate as the demo user.
const isDemo = import.meta.env.MODE === "demo";

function Root() {
  if (isDemo) {
    const client: ApiClient = new MockApiClient();
    return (
      <ApiProvider client={client}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ApiProvider>
    );
  }

  const storage = createLocalStorageTokenStorage();
  const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
  return (
    <ApiProvider baseUrl={baseUrl} storage={storage} onLogout={() => queryClient.clear()}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ApiProvider>
  );
}

function mount() {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>,
  );
}

// The demo build runs as a classic (non-deferred) script, so it may execute
// before #root is parsed — wait for the DOM in that case.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
