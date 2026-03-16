import { config } from "dotenv";
import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPool, verifyDatabaseConnection } from "./db.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const repoRoot = path.resolve(currentDir, "..", "..");

config();
config({ path: path.join(repoRoot, ".env"), override: false });

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(express.json());

type AuthenticatedUser = {
  email: string;
};

type LoginRequest = {
  email?: string;
  password?: string;
};

type UserRow = {
  email: string;
};

const SESSION_COOKIE_NAME = "homesync_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const sessions = new Map<string, AuthenticatedUser>();

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) {
    return {};
  }

  return header
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, part) => {
      const separator = part.indexOf("=");
      if (separator <= 0) {
        return accumulator;
      }

      const key = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();

      if (!key) {
        return accumulator;
      }

      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

function getSessionId(req: express.Request): string | undefined {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[SESSION_COOKIE_NAME]?.trim();
  return sessionId ? sessionId : undefined;
}

function buildSessionCookie(sessionId: string): string {
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ].join("; ");
}

function clearSessionCookie(): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
}

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = (req.body ?? {}) as LoginRequest;
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPassword = password?.trim();

  if (!normalizedEmail || !normalizedPassword) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  const pool = getPool();
  if (!pool) {
    return res.status(503).json({
      message: "Database connection is unavailable. Unable to sign in.",
    });
  }

  try {
    const query = `
      select email
      from app_user
      where lower(email) = $1
        and password_hash = $2
        and is_active = true
      limit 1
    `;
    const result = await pool.query<UserRow>(query, [
      normalizedEmail,
      normalizedPassword,
    ]);

    if (result.rowCount === 0) {
      return res
        .status(401)
        .json({ message: "Email or password is incorrect." });
    }

    const user: AuthenticatedUser = { email: result.rows[0].email };
    const sessionId = randomUUID();
    sessions.set(sessionId, user);

    res.setHeader("Set-Cookie", buildSessionCookie(sessionId));
    return res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: `Unable to sign in: ${message}` });
  }
});

app.get("/api/auth/me", (req, res) => {
  const sessionId = getSessionId(req);
  if (!sessionId) {
    return res.status(401).json({ message: "Not authenticated." });
  }

  const user = sessions.get(sessionId);
  if (!user) {
    return res.status(401).json({ message: "Not authenticated." });
  }

  return res.json(user);
});

app.post("/api/auth/logout", (req, res) => {
  const sessionId = getSessionId(req);
  if (sessionId) {
    sessions.delete(sessionId);
  }

  res.setHeader("Set-Cookie", clearSessionCookie());
  return res.status(204).send();
});

type DbTaskStatus = "todo" | "in_progress" | "done";
type UiTaskStatus = "To Do" | "In Progress" | "Done";

type TaskRow = {
  collab_item_id: number;
  title: string;
  status: DbTaskStatus;
  due_date: string | null;
};

type TaskResponse = {
  id: string;
  title: string;
  status: UiTaskStatus;
  date: string;
};

function mapDbStatusToUi(status: DbTaskStatus): UiTaskStatus {
  if (status === "done") return "Done";
  if (status === "in_progress") return "In Progress";
  return "To Do";
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toTaskResponse(row: TaskRow): TaskResponse {
  return {
    id: `task-${row.collab_item_id}`,
    title: row.title,
    status: mapDbStatusToUi(row.status),
    date: formatDate(row.due_date),
  };
}

app.get("/api/tasks", async (_req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({
      message:
        "Database connection is unavailable. Set DATABASE_URL to enable tasks.",
    });
  }

  try {
    const query = `
      select collab_item_id, title, status, due_date
      from collab_item
      where item_type = 'task'
      order by collab_item_id asc
    `;
    const result = await pool.query<TaskRow>(query);
    return res.json(result.rows.map(toTaskResponse));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res
      .status(500)
      .json({ message: `Unable to load tasks: ${message}` });
  }
});

app.patch("/api/tasks/:id/toggle", async (req, res) => {
  const taskId = Number(req.params.id);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({ message: "Invalid task id." });
  }

  const pool = getPool();
  if (!pool) {
    return res.status(503).json({
      message:
        "Database connection is unavailable. Set DATABASE_URL to enable task updates.",
    });
  }

  try {
    const toggleQuery = `
      update collab_item
      set status = case when status = 'done' then 'todo' else 'done' end
      where collab_item_id = $1
        and item_type = 'task'
      returning collab_item_id, title, status, due_date
    `;
    const result = await pool.query<TaskRow>(toggleQuery, [taskId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found." });
    }
    return res.json(toTaskResponse(result.rows[0]));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res
      .status(500)
      .json({ message: `Unable to update task: ${message}` });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, async () => {
  console.log(`[backend] Server listening on http://localhost:${port}`);
  await verifyDatabaseConnection();
});
