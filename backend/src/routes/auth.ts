import { Router } from "express";
import { ZodError } from "zod";
import { getPool } from "../db.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "../auth.js";
import { signupSchema, loginSchema } from "../validation.js";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: COOKIE_MAX_AGE,
};

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json({ message: msg });
  }
  const { firstName, lastName, email, password, userType } = parsed.data;

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    const existing = await pool.query("SELECT user_id FROM app_user WHERE email = $1", [
      email,
    ]);
    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }

    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      "INSERT INTO app_user (first_name, last_name, email, password_hash, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, first_name, last_name, email, user_type, token_version",
      [firstName, lastName, email, passwordHash, userType],
    );
    const user = result.rows[0];

    if (userType === "buyer") {
      await pool.query("INSERT INTO buyer (user_id) VALUES ($1)", [user.user_id]);
    } else if (userType === "realtor") {
      await pool.query("INSERT INTO realtor (user_id) VALUES ($1)", [user.user_id]);
    }

    const ip = req.ip ?? req.headers["x-forwarded-for"] ?? "unknown";
    console.info("[auth] Signup", { userId: user.user_id, email, userType, ip });

    const token = signToken({
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
      tokenVersion: user.token_version,
    });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    return res.status(201).json({
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      userType: user.user_type,
    });
  } catch (error) {
    console.error("[auth] Signup error:", error);
    return res.status(500).json({ message: "Signup failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json({ message: msg });
  }
  const { email, password, rememberMe } = parsed.data;
  const ip = req.ip ?? req.headers["x-forwarded-for"] ?? "unknown";

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    const result = await pool.query(
      "SELECT user_id, first_name, last_name, email, password_hash, user_type, token_version FROM app_user WHERE email = $1 AND is_active = true",
      [email],
    );
    const user = result.rows[0];

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      console.warn("[auth] Login failed", { email, ip, reason: "invalid credentials" });
      return res.status(401).json({ message: "Invalid email or password." });
    }

    console.info("[auth] Login success", { userId: user.user_id, email, ip });

    const token = signToken(
      {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        tokenVersion: user.token_version,
      },
      rememberMe,
    );

    const cookieOpts = rememberMe
      ? COOKIE_OPTIONS
      : { ...COOKIE_OPTIONS, maxAge: undefined };
    res.cookie(COOKIE_NAME, token, cookieOpts);
    return res.json({
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      userType: user.user_type,
    });
  } catch (error) {
    console.error("[auth] Login error:", error);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
});

router.post("/logout", (req, res) => {
  const ip = req.ip ?? req.headers["x-forwarded-for"] ?? "unknown";
  console.info("[auth] Logout", { ip });
  res.clearCookie(COOKIE_NAME);
  return res.json({ message: "Logged out." });
});

router.get("/me", async (req, res) => {
  const cookies = (req as unknown as { cookies: Record<string, string> }).cookies;
  const token = cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Not authenticated." });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ message: "Invalid session." });

  const pool = getPool();
  let firstName = payload.firstName;
  let lastName = payload.lastName;
  if (pool && payload.tokenVersion !== undefined) {
    try {
      const result = await pool.query(
        "SELECT token_version, first_name, last_name FROM app_user WHERE user_id = $1",
        [payload.userId],
      );
      const row = result.rows[0];
      if (!row || row.token_version !== payload.tokenVersion) {
        res.clearCookie(COOKIE_NAME);
        return res.status(401).json({ message: "Session revoked. Please log in again." });
      }

      if (!firstName || !lastName) {
        firstName = row.first_name;
        lastName = row.last_name;
      }
    } catch {
      return res.status(500).json({ message: "Internal server error." });
    }
  }

  return res.json({
    userId: payload.userId,
    firstName,
    lastName,
    email: payload.email,
    userType: payload.userType,
  });
});

export default router;
