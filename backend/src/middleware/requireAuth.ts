import type { Request, Response, NextFunction } from "express";
import { verifyToken, COOKIE_NAME, type JwtPayload } from "../auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req as unknown as { cookies: Record<string, string> }).cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired session." });
  }
  req.user = payload;
  next();
}
