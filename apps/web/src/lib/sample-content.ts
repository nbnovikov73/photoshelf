import { PHOTO_STATUS } from "@photoshelf/shared";
import type { PhotoSummary, SeriesSummary, SiteSettings } from "@photoshelf/shared";

const image = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;

export const siteSettings: SiteSettings = {
  siteTitle: "PhotoShelf",
  siteDescription: "A personal shelf of selected photographs.",
  authorName: "N. Photographer",
  authorBio:
    "A quiet archive of streets, rooms, facades, and portraits. Built for photographs that deserve their own address.",
  contactEmail: "hello@photoshelf.local"
};

export const series: SeriesSummary[] = [
  {
    id: "series-urban-noir",
    title: "Urban Noir",
    slug: "urban-noir",
    description: "Night surfaces, hard light, and the geometry of the city.",
    coverPhotoUrl: image("photoshelf-urban-noir", 1400, 1800),
    sortOrder: 1
  },
  {
    id: "series-silent-rooms",
    title: "Silent Rooms",
    slug: "silent-rooms",
    description: "Interior studies with low noise and long shadows.",
    coverPhotoUrl: image("photoshelf-silent-rooms", 1400, 1800),
    sortOrder: 2
  }
];

export const photos: PhotoSummary[] = [
  {
    id: "photo-last-platform",
    title: "Last Platform",
    slug: "last-platform",
    description: "Concrete, rain, and a final train cutting through the frame.",
    status: PHOTO_STATUS.published,
    pinned: false,
    imageUrl: image("photoshelf-last-platform", 1800, 2400),
    thumbnailUrl: image("photoshelf-last-platform-thumb", 900, 1200),
    width: 1800,
    height: 2400,
    aspectRatio: 0.75,
    publishedAt: "2026-06-18T18:30:00.000Z",
    series: series[0],
    tags: ["noir", "station", "night"],
    exif: {
      camera: "Leica Q3",
      lens: "28mm",
      aperture: "f/2.8",
      shutterSpeed: "1/250",
      iso: 800
    }
  },
  {
    id: "photo-white-wall",
    title: "White Wall, Black Coat",
    slug: "white-wall-black-coat",
    description: "A portrait reduced to posture, fabric, and negative space.",
    status: PHOTO_STATUS.published,
    pinned: false,
    imageUrl: image("photoshelf-white-wall", 1800, 2250),
    thumbnailUrl: image("photoshelf-white-wall-thumb", 900, 1125),
    width: 1800,
    height: 2250,
    aspectRatio: 0.8,
    publishedAt: "2026-05-29T12:00:00.000Z",
    tags: ["portrait", "editorial"],
    exif: {
      camera: "Nikon Zf",
      lens: "50mm",
      aperture: "f/1.8",
      shutterSpeed: "1/500",
      iso: 400
    }
  },
  {
    id: "photo-after-hours",
    title: "After Hours",
    slug: "after-hours",
    description: "An empty room after the last person has left.",
    status: PHOTO_STATUS.published,
    pinned: false,
    imageUrl: image("photoshelf-after-hours", 1800, 2400),
    thumbnailUrl: image("photoshelf-after-hours-thumb", 900, 1200),
    width: 1800,
    height: 2400,
    aspectRatio: 0.75,
    publishedAt: "2026-05-06T21:10:00.000Z",
    series: series[1],
    tags: ["interior", "shadow"]
  },
  {
    id: "photo-roofline-study",
    title: "Roofline Study",
    slug: "roofline-study",
    description: "A draft study waiting for final selection.",
    status: PHOTO_STATUS.draft,
    pinned: false,
    imageUrl: image("photoshelf-draft-roofline", 1800, 2400),
    thumbnailUrl: image("photoshelf-draft-roofline-thumb", 900, 1200),
    width: 1800,
    height: 2400,
    aspectRatio: 0.75,
    series: series[0],
    tags: ["draft", "architecture"]
  }
];

export function getPublishedPhotos(): PhotoSummary[] {
  return photos
    .filter((photo) => photo.status === PHOTO_STATUS.published)
    .sort((left, right) => {
      const leftDate = left.publishedAt ? Date.parse(left.publishedAt) : 0;
      const rightDate = right.publishedAt ? Date.parse(right.publishedAt) : 0;
      return rightDate - leftDate;
    });
}

export function getLatestPublishedPhotos(count: number): PhotoSummary[] {
  return getPublishedPhotos().slice(0, count);
}

export function getPublishedPhotoBySlug(slug: string): PhotoSummary | undefined {
  return getPublishedPhotos().find((photo) => photo.slug === slug);
}

export function getAdminPhotos(): PhotoSummary[] {
  return [...photos].sort((left, right) => left.title.localeCompare(right.title));
}

export function getPublishedSeries(): SeriesSummary[] {
  return series
    .filter((item) =>
      getPublishedPhotos().some((photo) => photo.series?.slug === item.slug)
    )
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getPublishedSeriesBySlug(slug: string): SeriesSummary | undefined {
  return getPublishedSeries().find((item) => item.slug === slug);
}

export function getPublishedPhotosBySeries(slug: string): PhotoSummary[] {
  return getPublishedPhotos().filter((photo) => photo.series?.slug === slug);
}
