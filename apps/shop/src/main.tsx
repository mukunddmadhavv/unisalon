import {ClerkProvider} from "@clerk/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

const rawKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const PUBLISHABLE_KEY = (rawKey && rawKey.trim() !== "") ? rawKey : "pk_test_bG92ZWQtbXVzdGFuZy0zNC5jbGVyay5hY2NvdW50cy5kZXYk";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <App />
        </ClerkProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1a1a1a", color: "#fff", border: "1px solid #2a2a2a", fontFamily: "Inter, sans-serif" },
            success: { iconTheme: { primary: "#f97316", secondary: "#fff" } },
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);