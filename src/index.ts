import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import router from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = new Hono();

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:3000",
  // Also add backend URLs to handle requests from same origin
  BACKEND_URL,
  "http://localhost:8080",
];

app.use(
  "*",
  cors({
    origin: (origin) => {
      // 1. Allow if there is no origin (like mobile apps or curl)
      if (!origin) return origin;

      // 2. Allow localhost for development
      if (origin.includes("localhost")) return origin;

      // 3. Allow your main domain and ALL subdomains (laso.la)
      if (origin.endsWith(".laso.la") || origin === "https://laso.la") {
        return origin;
      }

      // 4. Fallback: Check against your env variables
      if (allowedOrigins.includes(origin)) return origin;

      return null; // Reject everything else
    },
    credentials: true, // Required for httpOnly cookies
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    maxAge: 600,
  }),
);

app.use("*", logger());

app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.path}`);
  console.log("Origin:", c.req.header("origin"));
  await next();
});

app.use("*", errorHandler);

// Health check
app.get("/", (c) => {
  return c.json({ message: "1MinuteShop API" });
});

// API routes
app.route("/api", router);

// Start server only if not in test environment
if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 8080;

  serve({
    fetch: app.fetch,
    port: Number(port),
  });

  console.log(`Server running on http://localhost:${port}`);
}

// Export app for testing
export { app };
