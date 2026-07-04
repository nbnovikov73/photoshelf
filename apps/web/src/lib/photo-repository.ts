import { PHOTO_STATUS, normalizeSlug } from "@photoshelf/shared";
import type { PhotoStatus } from "@photoshelf/shared";
import { prisma } from "@photoshelf/db";
import { photos as samplePhotos, series as sampleSeries } from "./sample-content";
import { mapPhoto, mapSeries } from "./photo-mappers";
import type { PhotoSummary, SeriesSummary } from "@photoshelf/shared";

const photoInclude = {
  series: true,
  tags: {
    include: {
      tag: true
    }
  }
} as const;

export interface CreatePhotoDraftInput {
  aperture?: string;
  aspectRatio?: number;
  blurDataUrl?: string;
  camera?: string;
  description?: string;
  focalLength?: string;
  height?: number;
  imageUrl: string;
  iso?: number;
  lens?: string;
  locationText?: string;
  originalUrl: string;
  photoId: string;
  seriesTitle?: string;
  shutterSpeed?: string;
  tags?: string[];
  takenAt?: Date;
  thumbnailUrl: string;
  title: string;
  width?: number;
}

export interface UpdatePhotoInput {
  description?: string;
  seriesTitle?: string;
  status?: PhotoStatus;
  tags?: string[];
  title?: string;
}

function getFallbackPublishedPhotos(): PhotoSummary[] {
  return samplePhotos.filter((photo) => photo.status === PHOTO_STATUS.published);
}

function normalizeOptionalText(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function uniqueStrings(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

async function createUniquePhotoSlug(title: string, excludePhotoId?: string): Promise<string> {
  const baseSlug = normalizeSlug(title) || "untitled-photograph";
  let slug = baseSlug;
  let suffix = 2;

  while (
    await prisma.photo.findFirst({
      where: {
        slug,
        ...(excludePhotoId ? { id: { not: excludePhotoId } } : {})
      },
      select: {
        id: true
      }
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function upsertSeries(title: string | undefined): Promise<string | null> {
  const normalizedTitle = normalizeOptionalText(title);

  if (!normalizedTitle) {
    return null;
  }

  const slug = normalizeSlug(normalizedTitle);
  const series = await prisma.series.upsert({
    create: {
      slug,
      title: normalizedTitle
    },
    update: {
      title: normalizedTitle
    },
    where: {
      slug
    }
  });

  return series.id;
}

async function replaceTags(photoId: string, tagNames: string[] | undefined): Promise<void> {
  const names = uniqueStrings(tagNames);

  await prisma.photoTag.deleteMany({
    where: {
      photoId
    }
  });

  if (names.length === 0) {
    return;
  }

  const tags = await Promise.all(
    names.map((name) =>
      prisma.tag.upsert({
        create: {
          name,
          slug: normalizeSlug(name)
        },
        update: {
          name
        },
        where: {
          slug: normalizeSlug(name)
        }
      })
    )
  );

  await prisma.photoTag.createMany({
    data: tags.map((tag) => ({
      photoId,
      tagId: tag.id
    })),
    skipDuplicates: true
  });
}

export async function listPublishedPhotos(): Promise<PhotoSummary[]> {
  try {
    const dbPhotos = await prisma.photo.findMany({
      include: photoInclude,
      orderBy: {
        publishedAt: "desc"
      },
      where: {
        status: PHOTO_STATUS.published
      }
    });

    return dbPhotos.map(mapPhoto);
  } catch {
    return getFallbackPublishedPhotos();
  }
}

export async function listLatestPublishedPhotos(count: number): Promise<PhotoSummary[]> {
  return (await listPublishedPhotos()).slice(0, count);
}

export async function getPublishedPhotoBySlugFromDb(
  slug: string
): Promise<PhotoSummary | undefined> {
  try {
    const photo = await prisma.photo.findFirst({
      include: photoInclude,
      where: {
        slug,
        status: PHOTO_STATUS.published
      }
    });

    return photo ? mapPhoto(photo) : undefined;
  } catch {
    return getFallbackPublishedPhotos().find((photo) => photo.slug === slug);
  }
}

export async function listAdminPhotos(): Promise<PhotoSummary[]> {
  try {
    const dbPhotos = await prisma.photo.findMany({
      include: photoInclude,
      orderBy: {
        updatedAt: "desc"
      }
    });

    return dbPhotos.map(mapPhoto);
  } catch {
    return [...samplePhotos].sort((left, right) => left.title.localeCompare(right.title));
  }
}

export async function getAdminPhotoById(photoId: string): Promise<PhotoSummary | undefined> {
  try {
    const photo = await prisma.photo.findUnique({
      include: photoInclude,
      where: {
        id: photoId
      }
    });

    return photo ? mapPhoto(photo) : undefined;
  } catch {
    return samplePhotos.find((photo) => photo.id === photoId);
  }
}

export async function listPublishedSeries(): Promise<SeriesSummary[]> {
  try {
    const dbSeries = await prisma.series.findMany({
      orderBy: {
        sortOrder: "asc"
      },
      where: {
        photos: {
          some: {
            status: PHOTO_STATUS.published
          }
        }
      }
    });

    return dbSeries.map(mapSeries);
  } catch {
    return sampleSeries.filter((item) =>
      getFallbackPublishedPhotos().some((photo) => photo.series?.slug === item.slug)
    );
  }
}

export async function getPublishedSeriesBySlugFromDb(
  slug: string
): Promise<SeriesSummary | undefined> {
  return (await listPublishedSeries()).find((item) => item.slug === slug);
}

export async function listPublishedPhotosBySeries(
  slug: string
): Promise<PhotoSummary[]> {
  return (await listPublishedPhotos()).filter((photo) => photo.series?.slug === slug);
}

export async function createPhotoDraft(
  input: CreatePhotoDraftInput
): Promise<PhotoSummary> {
  const seriesId = await upsertSeries(input.seriesTitle);
  const slug = await createUniquePhotoSlug(input.title);

  const photo = await prisma.photo.create({
    data: {
      aperture: input.aperture,
      aspectRatio: input.aspectRatio,
      blurDataUrl: input.blurDataUrl,
      camera: input.camera,
      description: normalizeOptionalText(input.description),
      focalLength: input.focalLength,
      height: input.height,
      id: input.photoId,
      imageUrl: input.imageUrl,
      iso: input.iso,
      lens: input.lens,
      locationText: input.locationText,
      originalUrl: input.originalUrl,
      seriesId,
      shutterSpeed: input.shutterSpeed,
      slug,
      status: PHOTO_STATUS.draft,
      takenAt: input.takenAt,
      thumbnailUrl: input.thumbnailUrl,
      title: input.title,
      width: input.width
    },
    include: photoInclude
  });

  await replaceTags(photo.id, input.tags);

  const photoWithTags = await prisma.photo.findUniqueOrThrow({
    include: photoInclude,
    where: {
      id: photo.id
    }
  });

  return mapPhoto(photoWithTags);
}

export async function updatePhoto(
  photoId: string,
  input: UpdatePhotoInput
): Promise<PhotoSummary> {
  const existing = await prisma.photo.findUniqueOrThrow({
    where: {
      id: photoId
    }
  });

  const title = normalizeOptionalText(input.title) ?? existing.title;
  const seriesId =
    input.seriesTitle === undefined
      ? existing.seriesId
      : await upsertSeries(input.seriesTitle);
  const status = input.status ?? existing.status;
  const publishedAt =
    status === PHOTO_STATUS.published
      ? existing.publishedAt ?? new Date()
      : null;

  const updated = await prisma.photo.update({
    data: {
      description:
        input.description === undefined
          ? existing.description
          : normalizeOptionalText(input.description),
      publishedAt,
      seriesId,
      slug: title !== existing.title ? await createUniquePhotoSlug(title, photoId) : existing.slug,
      status,
      title
    },
    include: photoInclude,
    where: {
      id: photoId
    }
  });

  if (input.tags !== undefined) {
    await replaceTags(updated.id, input.tags);
  }

  const photoWithTags = await prisma.photo.findUniqueOrThrow({
    include: photoInclude,
    where: {
      id: updated.id
    }
  });

  return mapPhoto(photoWithTags);
}

export async function publishPhoto(photoId: string): Promise<PhotoSummary> {
  return updatePhoto(photoId, {
    status: PHOTO_STATUS.published
  });
}

export async function unpublishPhoto(photoId: string): Promise<PhotoSummary> {
  return updatePhoto(photoId, {
    status: PHOTO_STATUS.draft
  });
}
