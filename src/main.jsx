import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// ✅ Create an IndexedDB Persister
const createIDBPersister = (idbValidKey = "tanstack-query-cache") => ({
  persistClient: async (client) => {
    await set(idbValidKey, client);
  },
  restoreClient: async () => {
    return await get(idbValidKey);
  },
  removeClient: async () => {
    await del(idbValidKey);
  },
});

// ✅ Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24 * 30, // 30 days before refetching
      cacheTime: 1000 * 60 * 60 * 24 * 30, // Keep cache for 30 days
    },
  },
});

// ✅ Enable QueryClient persistence with IndexedDB
const persister = createIDBPersister();

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days before cache expires
});

// ✅ Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: Infinity,
});

// ✅ Render the app
const rootElement = document.getElementById("root");
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  );
}