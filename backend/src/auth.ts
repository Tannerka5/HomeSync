import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const COOKIE_NAME = "homesync_token";
export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const envSecret = process.env.JWT_SECRET;
if (!envSecret && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable must be set in production");
}
if (!envSecret) {
  console.warn("[auth] JWT_SECRET not set — using insecure default for development only");
}
const JWT_SECRET = envSecret ?? "dev-secret-change-in-production";

export type JwtPayload = {
  userId: number;
  email: string;
  userType: string;
  tokenVersion: number;
};

export const hashPassword = (password: string) => bcrypt.hash(password, 12);

export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export function signToken(
  payload: JwtPayload,
  rememberMe = true,
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? "7d" : "1d",
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
