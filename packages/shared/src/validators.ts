import {
  DEFAULT_MAX_UPLOAD_MB,
  SUPPORTED_IMAGE_MIME_TYPES
} from "./constants";
import type { SupportedImageMimeType } from "./types";

export function isSupportedImageMimeType(
  mimeType: string
): mimeType is SupportedImageMimeType {
  return SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType as SupportedImageMimeType);
}

export function getMaxUploadBytes(maxUploadMb = DEFAULT_MAX_UPLOAD_MB): number {
  return maxUploadMb * 1024 * 1024;
}

export function isWithinUploadLimit(
  sizeBytes: number,
  maxUploadMb = DEFAULT_MAX_UPLOAD_MB
): boolean {
  return sizeBytes <= getMaxUploadBytes(maxUploadMb);
}

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
