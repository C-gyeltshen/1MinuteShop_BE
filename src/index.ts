// import { Hono } from "hono";
// import { cors } from "hono/cors";
// import { logger } from "hono/logger";
// import { serve } from "@hono/node-server";
// import { getCookie } from "hono/cookie"; // Add this import
// import router from "./routes/index.js";
// import { errorHandler } from "./middlewares/errorHandler.js";

// const app = new Hono();

// const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// // Function to determine allowed origins dynamically
// const getAllowedOrigins = () => {
//   const baseOrigins = [
//     FRONTEND_URL,
//     "http://localhost:3000",
//     "https://laso.la",
//   ];

//   return (origin: string): string | null => {
//     // Allow exact matches
//     if (baseOrigins.includes(origin)) return origin;

//     // Allow dynamic subdomains on laso.la (e.g., mystore.laso.la)
//     if (/^https:\/\/[a-zA-Z0-9-]+\.laso\.la$/.test(origin)) return origin;

//     // Allow dynamic subdomains on localhost:3000 for development
//     if (/^http:\/\/[a-zA-Z0-9-]+\.localhost:3000$/.test(origin)) return origin;

//     return null;
//   };
// };

// app.use(
//   "*",
//   cors({
//     origin: getAllowedOrigins(),
//     credentials: true, // ✓ Required for cookies
//     allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowHeaders: ["Content-Type", "Authorization"],
//     exposeHeaders: ["Content-Length", "Set-Cookie"],
//     maxAge: 600,
//   })
// );

// app.use("*", logger());

// app.use("*", async (c, next) => {
//   console.log(`${c.req.method} ${c.req.path}`);
//   console.log("Origin:", c.req.header("origin"));
  
//   // Debug: Log cookies being received
//   const accessToken = getCookie(c, "accessToken");
//   const refreshToken = getCookie(c, "refreshToken");
//   console.log("Received cookies:", { accessToken: !!accessToken, refreshToken: !!refreshToken });
  
//   await next();
// });

// app.use("*", errorHandler);

// // Health check
// app.get("/", (c) => {
//   return c.json({ message: "1MinuteShop API" });
// });

// // API routes
// app.route("/api", router);

// // Start server only if not in test environment
// if (process.env.NODE_ENV !== "test") {
//   const port = process.env.PORT || 8080;

//   serve({
//     fetch: app.fetch,
//     port: Number(port),
//   });

//   console.log(`Server running on http://localhost:${port}`);
// }

// export { app };

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
    origin: allowedOrigins,
    credentials: true, // Required for httpOnly cookies
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    maxAge: 600,
  })
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