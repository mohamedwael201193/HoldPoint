import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider } from "convex/react";
import { BrowserRouter } from "react-router";
import App from "./App";
import { convex, convexUrl } from "./lib/convex";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("root element missing");
}

createRoot(root).render(
  <StrictMode>
    {convex ? (
      <ConvexProvider client={convex}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexProvider>
    ) : (
      <div className="min-h-dvh bg-[#0b0c0a] p-8 text-[#efe8d8]">
        <p className="text-sm tracking-[0.2em] uppercase text-[#d2652d]">HoldPoint</p>
        <h1 className="mt-4 text-3xl font-semibold">Convex URL is not injected</h1>
        <p className="mt-4 max-w-xl text-[#9b9586] leading-relaxed">
          VITE_CONVEX_URL is empty in this build. The board will not invent a backend. Set the
          public Convex cloud URL and rebuild. Current value: {convexUrl || "(empty)"}
        </p>
      </div>
    )}
  </StrictMode>,
);
