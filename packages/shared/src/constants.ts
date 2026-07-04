export const PHOTO_STATUS = {
  draft: "DRAFT",
  published: "PUBLISHED"
} as const;

export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
] as const;

export const DEFAULT_MAX_UPLOAD_MB = 30;
export const LARGE_IMAGE_MAX_WIDTH = 2400;
export const THUMBNAIL_MAX_WIDTH = 600;

export const PHOTO_OBJECT_KEY_PATTERN = "photos/{photoId}/{variant}.{ext}";
