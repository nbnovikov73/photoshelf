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

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya", є: "ye", і: "i", ї: "yi", ґ: "g"
};

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[Ѐ-ӿ]/g, (char) => CYRILLIC_TO_LATIN[char] ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
