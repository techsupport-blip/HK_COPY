import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import {
  ApiProvider,
  createLocalStorageTokenStorage,
} from "@hearth/client";
import { router } from "./router";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const storage = createLocalStorageTokenStorage();
const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApiProvider
      baseUrl={baseUrl}
      storage={storage}
      onLogout={() => queryClient.clear()}
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ApiProvider>
  </React.StrictMode>,
);
