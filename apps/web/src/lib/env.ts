import { DEFAULT_MAX_UPLOAD_MB } from "@photoshelf/shared";

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getOptionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export function getMaxUploadMb(): number {
  const rawValue = process.env.MAX_UPLOAD_MB;

  if (!rawValue) {
    return DEFAULT_MAX_UPLOAD_MB;
  }

  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_UPLOAD_MB;
}
