import { Router } from "express";
import { getPool } from "../db.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "../auth.js";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: COOKIE_MAX_AGE,
};

router.post("/signup", async (req, res) => {
  const { email, password, userType } = req.body as {
    email?: string;
    password?: string;
    userType?: string;
  };

  if (!email || !password || !userType) {
    return res.status(400).json({ message: "Email, password, and user type are required." });
  }
  if (!["buyer", "realtor", "collaborator"].includes(userType)) {
    return res.status(400).json({ message: "Invalid user type." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    const existing = await pool.query("SELECT user_id FROM app_user WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }

    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      "INSERT INTO app_user (email, password_hash, user_type) VALUES ($1, $2, $3) RETURNING user_id, email, user_type",
      [email.toLowerCase(), passwordHash, userType],
    );
    const user = result.rows[0];

    const token = signToken({
      userId: user.user_id,
      email: user.email,
      userType: user.user_type,
    });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    return res.status(201).json({
      userId: user.user_id,
      email: user.email,
      userType: user.user_type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: `Signup failed: ${message}` });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    const result = await pool.query(
      "SELECT user_id, email, password_hash, user_type FROM app_user WHERE email = $1 AND is_active = true",
      [email.toLowerCase()],
    );
    const user = result.rows[0];

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken({
      userId: user.user_id,
      email: user.email,
      userType: user.user_type,
    });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    return res.json({ userId: user.user_id, email: user.email, userType: user.user_type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: `Login failed: ${message}` });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  return res.json({ message: "Logged out." });
});

router.get("/me", (req, res) => {
  const cookies = (req as unknown as { cookies: Record<string, string> }).cookies;
  const token = cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Not authenticated." });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ message: "Invalid session." });

  return res.json({
    userId: payload.userId,
    email: payload.email,
    userType: payload.userType,
  });
});

export default router;
