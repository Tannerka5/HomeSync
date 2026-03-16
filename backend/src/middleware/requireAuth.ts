import type { Request, Response, NextFunction } from "express";
import { verifyToken, COOKIE_NAME, type JwtPayload } from "../auth.js";
import { getPool } from "../db.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req as unknown as { cookies: Record<string, string> }).cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired session." });
  }

  const pool = getPool();
  if (pool && payload.tokenVersion !== undefined) {
    try {
      const result = await pool.query(
        "SELECT token_version FROM app_user WHERE user_id = $1",
        [payload.userId],
      );
      const row = result.rows[0];
      if (!row || row.token_version !== payload.tokenVersion) {
        return res.status(401).json({ message: "Session revoked. Please log in again." });
      }
    } catch {
      return res.status(500).json({ message: "Internal server error." });
    }
  }

  req.user = payload;
  next();
}
