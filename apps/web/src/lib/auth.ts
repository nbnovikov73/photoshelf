import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@photoshelf/db";

export const SESSION_COOKIE_NAME = "photoshelf_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const FALLBACK_DEV_SECRET = "photoshelf-dev-session-secret";
const FALLBACK_DEV_EMAIL = "admin@photoshelf.local";
const FALLBACK_DEV_PASSWORD = "photoshelf-dev";

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || FALLBACK_DEV_SECRET;
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000
    })
  ).toString("base64url");
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature || !safeEqual(signature, sign(payload))) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      expiresAt?: number;
    };

    return typeof decoded.expiresAt === "number" && decoded.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export async function isValidAdminCredential(
  email: string,
  password: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || FALLBACK_DEV_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const adminInitialPassword = process.env.ADMIN_INITIAL_PASSWORD || FALLBACK_DEV_PASSWORD;
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail !== adminEmail.trim().toLowerCase()) {
    return false;
  }

  if (adminPasswordHash) {
    return bcrypt.compare(password, adminPasswordHash);
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (existingUser) {
      return bcrypt.compare(password, existingUser.passwordHash);
    }

    if (password !== adminInitialPassword) {
      return false;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash
      }
    });

    return true;
  } catch {
    return password === adminInitialPassword;
  }
}
