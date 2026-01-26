import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { getCookie } from "hono/cookie"; // Add this import
import router from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = new Hono();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Function to determine allowed origins dynamically
const getAllowedOrigins = () => {
  const baseOrigins = [FRONTEND_URL, "http://localhost:3000", "https://laso.la"];

  return (origin: string | undefined): string | null => {
    // 1. If there is no origin (direct access, server-to-server, or same-origin),
    // we usually want to allow it.
    if (!origin) return "*"; // Or return a specific default origin

    // 2. Allow exact matches
    if (baseOrigins.includes(origin)) return origin;

    // 3. Allow dynamic subdomains
    if (/^https:\/\/[a-zA-Z0-9-]+\.laso\.la$/.test(origin)) return origin;
    if (/^http:\/\/[a-zA-Z0-9-]+\.localhost:3000$/.test(origin)) return origin;

    return null;
  };
};

app.use(
  "*",
  cors({
    origin: getAllowedOrigins(),
    credentials: true, // ✓ Required for cookies
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    maxAge: 600,
  })
);

app.use("*", logger());

app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.path}`);
  console.log("Request Origin:", c.req.header("origin"));
  
  // Debug: Log cookies being received
  const accessToken = getCookie(c, "accessToken");
  const refreshToken = getCookie(c, "refreshToken");
  console.log("Received cookies:", { accessToken: !!accessToken, refreshToken: !!refreshToken });
  
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

export { app };