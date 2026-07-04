import type { Photo, PhotoTag, Series, Tag } from "@prisma/client";
import type { PhotoSummary, SeriesSummary } from "@photoshelf/shared";

type PhotoWithRelations = Photo & {
  series: Series | null;
  tags: Array<PhotoTag & { tag: Tag }>;
};

export function mapSeries(series: Series): SeriesSummary {
  return {
    id: series.id,
    title: series.title,
    slug: series.slug,
    description: series.description ?? undefined,
    sortOrder: series.sortOrder
  };
}

export function mapPhoto(photo: PhotoWithRelations): PhotoSummary {
  return {
    id: photo.id,
    title: photo.title,
    slug: photo.slug,
    description: photo.description ?? undefined,
    status: photo.status,
    originalUrl: photo.originalUrl,
    imageUrl: photo.imageUrl,
    thumbnailUrl: photo.thumbnailUrl,
    blurDataUrl: photo.blurDataUrl ?? undefined,
    width: photo.width ?? undefined,
    height: photo.height ?? undefined,
    aspectRatio: photo.aspectRatio ?? undefined,
    publishedAt: photo.publishedAt?.toISOString(),
    pinned: photo.pinnedAt !== null,
    series: photo.series ? mapSeries(photo.series) : undefined,
    tags: photo.tags.map((item) => item.tag.name),
    exif: {
      aperture: photo.aperture ?? undefined,
      camera: photo.camera ?? undefined,
      focalLength: photo.focalLength ?? undefined,
      iso: photo.iso ?? undefined,
      lens: photo.lens ?? undefined,
      locationText: photo.locationText ?? undefined,
      shutterSpeed: photo.shutterSpeed ?? undefined,
      takenAt: photo.takenAt?.toISOString()
    }
  };
}
