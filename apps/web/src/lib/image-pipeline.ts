import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import {
  LARGE_IMAGE_MAX_WIDTH,
  THUMBNAIL_MAX_WIDTH,
  isSupportedImageMimeType,
  isWithinUploadLimit
} from "@photoshelf/shared";
// exifr is CommonJS: a named import breaks in the ESM production build
import exifr from "exifr";
import sharp from "sharp";
import { getMaxUploadMb } from "./env";
import { putObject } from "./storage";
import { createPhotoDraft } from "./photo-repository";
import type { PhotoSummary } from "@photoshelf/shared";

interface ExifData {
  aperture?: string;
  camera?: string;
  focalLength?: string;
  iso?: number;
  lens?: string;
  shutterSpeed?: string;
  takenAt?: Date;
}

interface UploadMetadataInput {
  description?: string;
  seriesTitle?: string;
  tags?: string[];
  title?: string;
}

function getExtensionForMimeType(mimeType: string): "jpg" | "png" | "webp" {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function getString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getDate(record: Record<string, unknown>, key: string): Date | undefined {
  const value = record[key];
  return value instanceof Date ? value : undefined;
}

function formatFraction(value: number | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value >= 1) {
    return `${value}s`;
  }

  return `1/${Math.round(1 / value)}s`;
}

function formatAperture(value: number | undefined): string | undefined {
  return value ? `f/${Number(value.toFixed(1))}` : undefined;
}

function formatFocalLength(value: number | undefined): string | undefined {
  return value ? `${Number(value.toFixed(1))}mm` : undefined;
}

function fallbackTitleFromFileName(fileName: string): string {
  const withoutExtension = basename(fileName).replace(/\.[^.]+$/, "");
  const normalized = withoutExtension.replace(/[-_]+/g, " ").trim();

  return normalized || "Untitled photograph";
}

function parseTags(tagsInput: string | undefined): string[] {
  return (tagsInput ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function extractExif(buffer: Buffer): Promise<ExifData> {
  try {
    const raw = (await exifr.parse(buffer)) as unknown;

    if (!raw || typeof raw !== "object") {
      return {};
    }

    const record = raw as Record<string, unknown>;
    const make = getString(record, "Make");
    const model = getString(record, "Model");

    return {
      aperture: formatAperture(getNumber(record, "FNumber")),
      camera: [make, model].filter(Boolean).join(" ") || undefined,
      focalLength: formatFocalLength(getNumber(record, "FocalLength")),
      iso: getNumber(record, "ISO"),
      lens: getString(record, "LensModel") ?? getString(record, "Lens"),
      shutterSpeed: formatFraction(getNumber(record, "ExposureTime")),
      takenAt:
        getDate(record, "DateTimeOriginal") ??
        getDate(record, "CreateDate") ??
        getDate(record, "ModifyDate")
    };
  } catch {
    return {};
  }
}

export async function processPhotoUpload(formData: FormData): Promise<PhotoSummary> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("A photograph file is required.");
  }

  if (!isSupportedImageMimeType(file.type)) {
    throw new Error("Only JPEG, PNG, and WebP files are supported.");
  }

  const maxUploadMb = getMaxUploadMb();

  if (!isWithinUploadLimit(file.size, maxUploadMb)) {
    throw new Error(`Upload must be ${maxUploadMb} MB or smaller.`);
  }

  const photoId = randomUUID();
  const extension = getExtensionForMimeType(file.type);
  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const exif = await extractExif(originalBuffer);
  const image = sharp(originalBuffer, {
    failOn: "none"
  }).rotate();

  const large = await image
    .clone()
    .resize({
      width: LARGE_IMAGE_MAX_WIDTH,
      withoutEnlargement: true
    })
    .webp({
      quality: 84
    })
    .toBuffer({
      resolveWithObject: true
    });

  const thumbnail = await image
    .clone()
    .resize({
      width: THUMBNAIL_MAX_WIDTH,
      withoutEnlargement: true
    })
    .webp({
      quality: 78
    })
    .toBuffer();

  const blur = await image
    .clone()
    .resize({
      width: 24,
      withoutEnlargement: true
    })
    .jpeg({
      quality: 35
    })
    .toBuffer();

  const originalKey = `photos/${photoId}/original.${extension}`;
  const largeKey = `photos/${photoId}/large.webp`;
  const thumbKey = `photos/${photoId}/thumb.webp`;

  const [originalUrl, imageUrl, thumbnailUrl] = await Promise.all([
    putObject({
      body: originalBuffer,
      contentType: file.type,
      key: originalKey
    }),
    putObject({
      body: large.data,
      contentType: "image/webp",
      key: largeKey
    }),
    putObject({
      body: thumbnail,
      contentType: "image/webp",
      key: thumbKey
    })
  ]);

  const metadata: UploadMetadataInput = {
    description: String(formData.get("description") ?? ""),
    seriesTitle: String(formData.get("seriesTitle") ?? ""),
    tags: parseTags(String(formData.get("tags") ?? "")),
    title: String(formData.get("title") ?? "")
  };
  // keep the user's title as-is (any language); slug generation has its own fallback
  const normalizedTitle = metadata.title?.trim() || fallbackTitleFromFileName(file.name);

  return createPhotoDraft({
    aperture: exif.aperture,
    aspectRatio:
      large.info.width && large.info.height ? large.info.width / large.info.height : undefined,
    blurDataUrl: `data:image/jpeg;base64,${blur.toString("base64")}`,
    camera: exif.camera,
    description: metadata.description,
    focalLength: exif.focalLength,
    height: large.info.height,
    imageUrl,
    iso: exif.iso,
    lens: exif.lens,
    originalUrl,
    photoId,
    seriesTitle: metadata.seriesTitle,
    shutterSpeed: exif.shutterSpeed,
    tags: metadata.tags,
    takenAt: exif.takenAt,
    thumbnailUrl,
    title: normalizedTitle,
    width: large.info.width
  });
}
