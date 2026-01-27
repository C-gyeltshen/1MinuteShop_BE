import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { getCookie } from "hono/cookie";
import router from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = new Hono();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Function to determine allowed origins dynamically
const getAllowedOrigins = () => {
  const baseOrigins = [FRONTEND_URL, "http://localhost:3000", "https://laso.la"];

  return (origin: string | undefined): string | null => {
    if (!origin) return "*";
    if (baseOrigins.includes(origin)) return origin;
    if (/^https:\/\/[a-zA-Z0-9-]+\.laso\.la$/.test(origin)) return origin;
    if (/^http:\/\/[a-zA-Z0-9-]+\.localhost:3000$/.test(origin)) return origin;
    return null;
  };
};


app.use(
  "*",
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    maxAge: 600,
  })
);

app.use("*", logger());

app.use("*", async (c, next) => {
  console.log(`\n📍 ${c.req.method} ${c.req.path}`);
  console.log("🌐 Request Origin:", c.req.header("origin") || "No origin header");
  
  // Log all headers
  const cookieHeader = c.req.header("cookie");
  console.log("📋 Cookie Header:", cookieHeader || "No cookies");
  
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