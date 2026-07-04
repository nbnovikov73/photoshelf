import type { PHOTO_STATUS, SUPPORTED_IMAGE_MIME_TYPES } from "./constants";

export type PhotoStatus = (typeof PHOTO_STATUS)[keyof typeof PHOTO_STATUS];
export type SupportedImageMimeType = (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];

export interface ExifSummary {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  focalLength?: string;
  takenAt?: string;
  locationText?: string;
}

export interface PhotoSummary {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: PhotoStatus;
  originalUrl?: string;
  imageUrl: string;
  thumbnailUrl: string;
  blurDataUrl?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  publishedAt?: string;
  pinned: boolean;
  series?: SeriesSummary;
  tags: string[];
  exif?: ExifSummary;
}

export interface SeriesSummary {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverPhotoUrl?: string;
  sortOrder: number;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription?: string;
  authorName?: string;
  authorBio?: string;
  contactEmail?: string;
  instagramUrl?: string;
  telegramUrl?: string;
}

export interface PhotoDraftFormState {
  title: string;
  description: string;
  seriesTitle: string;
  tags: string[];
  status: PhotoStatus;
}
