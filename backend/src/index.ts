import { config } from "dotenv";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyDatabaseConnection } from "./db.js";
import { requireAuth } from "./middleware/requireAuth.js";
import authRouter from "./routes/auth.js";
import listingsRouter from "./routes/listings.js";
import boardRouter from "./routes/board.js";
import chatsRouter from "./routes/chats.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const repoRoot = path.resolve(currentDir, "..", "..");

config();
config({ path: path.join(repoRoot, ".env"), override: false });

const app = express();
const port = Number(process.env.PORT ?? 4000);

// --- Security headers ---
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// --- CSRF Origin validation (production only, when ALLOWED_ORIGINS is set) ---
if (process.env.ALLOWED_ORIGINS) {
  const allowed = process.env.ALLOWED_ORIGINS.split(",");
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const origin = req.headers.origin ?? req.headers.referer;
    if (!origin) return next();
    try {
      const url = new URL(String(origin));
      if (!allowed.includes(url.origin)) {
        return res.status(403).json({ message: "Forbidden." });
      }
    } catch {
      return res.status(403).json({ message: "Forbidden." });
    }
    next();
  });
}

// --- Rate limiting on auth endpoints ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

// --- Routes ---
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/listings", requireAuth, listingsRouter);
app.use("/api/board", requireAuth, boardRouter);
app.use("/api/chats", requireAuth, chatsRouter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

// --- Centralized error handler ---
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[backend] Unhandled error:", err);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(port, async () => {
  console.log(`[backend] Server listening on http://localhost:${port}`);
  await verifyDatabaseConnection();
});
