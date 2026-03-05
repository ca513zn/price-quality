import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret";
const COOKIE_NAME = "pq_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Hash a plain-text password.
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * Compare a plain-text password against a hash.
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Create a JWT token for a user.
 */
export function createToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Set the session cookie after login/register.
 */
export async function setSessionCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Remove the session cookie on logout.
 */
export async function removeSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get the current authenticated user from the session cookie.
 * Returns the user object (without password) or null.
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return user;
  } catch {
    return null;
  }
}

/**
 * Require authentication — throws if not logged in.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require admin role — throws if not admin.
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}
