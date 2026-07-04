# PhotoShelf Architecture

## 1. Architecture overview

PhotoShelf is an Astro-first full-stack application for personal photography publishing.

The system consists of Astro public site, Astro admin area with interactive islands, backend API endpoints, PostgreSQL database, Prisma ORM, S3-compatible object storage, image processing pipeline, and authentication layer.

Recommended initial implementation: one Astro app, API routes inside Astro, React islands only where interactivity is needed, Prisma for database access, MinIO for local S3-compatible storage, Docker Compose for local development.

Avoid premature microservices.

## 2. Repository structure

```txt
photoshelf/
  apps/
    web/
      src/
        components/
        layouts/
        pages/
        pages/admin/
        pages/api/
        lib/
        styles/
      public/
      astro.config.mjs
      package.json
  packages/
    db/
      prisma/
        schema.prisma
        migrations/
      src/
        client.ts
      package.json
    shared/
      src/
        types.ts
        constants.ts
        validators.ts
      package.json
  docs/
  .codex/
  docker-compose.yml
  .env.example
  README.md
  PRD.md
  ARCHITECTURE.md
  CODING_RULES.md
```

## 3. Technology choices

Use Astro for public pages and the main app. Use React only for interactive admin components such as upload form, image preview, tag input, admin forms, and publish controls.

Use Astro API routes for MVP. If complexity later requires it, the API can be moved into Fastify. Do not do that in MVP unless necessary.

Use PostgreSQL with Prisma. Use S3-compatible storage, with MinIO locally. Use Sharp for image processing and `exifr` or similar for EXIF extraction.

## 4. Runtime architecture

```txt
Browser / Mobile PWA
        |
        v
Astro app
  - public pages
  - admin pages
  - API routes
        |
        +---- PostgreSQL via Prisma
        |
        +---- S3-compatible storage
        |
        +---- Sharp image processing
```

## 5. Prisma schema draft

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  bio          String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Photo {
  id            String      @id @default(cuid())
  title         String
  slug          String      @unique
  description   String?
  status        PhotoStatus @default(DRAFT)
  originalUrl   String
  imageUrl      String
  thumbnailUrl  String
  blurDataUrl   String?
  width         Int?
  height        Int?
  aspectRatio   Float?
  takenAt       DateTime?
  publishedAt   DateTime?
  camera        String?
  lens          String?
  aperture      String?
  shutterSpeed  String?
  iso           Int?
  focalLength   String?
  locationText  String?
  seriesId      String?
  series        Series?     @relation(fields: [seriesId], references: [id])
  tags          PhotoTag[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Series {
  id            String   @id @default(cuid())
  title         String
  slug          String   @unique
  description   String?
  sortOrder     Int      @default(0)
  coverPhotoId  String?
  photos        Photo[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Tag {
  id        String     @id @default(cuid())
  name      String
  slug      String     @unique
  photos    PhotoTag[]
  createdAt DateTime   @default(now())
}

model PhotoTag {
  photoId String
  tagId   String
  photo   Photo @relation(fields: [photoId], references: [id], onDelete: Cascade)
  tag     Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([photoId, tagId])
}

model SiteSettings {
  id              String   @id @default(cuid())
  siteTitle       String
  siteDescription String?
  authorName      String?
  authorBio       String?
  contactEmail    String?
  instagramUrl    String?
  telegramUrl     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum PhotoStatus {
  DRAFT
  PUBLISHED
}
```

## 6. API design

Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

Photos: `GET /api/photos`, `GET /api/photos/:id`, `POST /api/photos/upload`, `PATCH /api/photos/:id`, `DELETE /api/photos/:id`, `POST /api/photos/:id/publish`, `POST /api/photos/:id/unpublish`.

Series: `GET /api/series`, `POST /api/series`, `PATCH /api/series/:id`, `DELETE /api/series/:id`.

Settings: `GET /api/settings`, `PATCH /api/settings`.

## 7. Image upload pipeline

1. Validate authentication.
2. Accept multipart file upload.
3. Validate MIME type and file size.
4. Generate internal photo ID.
5. Store original image.
6. Read EXIF metadata.
7. Normalize orientation.
8. Generate optimized image.
9. Generate thumbnail.
10. Generate blur placeholder.
11. Save metadata to database as draft.
12. Return photo draft object.

Suggested object keys:

```txt
photos/{photoId}/original.{ext}
photos/{photoId}/large.webp
photos/{photoId}/thumb.webp
```

## 8. Authentication

Use simple password authentication for MVP: bcrypt or argon2, HTTP-only session cookie, CSRF protection if using cookie auth, and middleware-protected admin routes.

## 9. Environment variables

```txt
DATABASE_URL=
SESSION_SECRET=
ADMIN_EMAIL=
ADMIN_INITIAL_PASSWORD=
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=
MAX_UPLOAD_MB=30
```

## 10. Development order

1. Project scaffold.
2. Database schema.
3. Docker Compose with PostgreSQL and MinIO.
4. Astro public layout.
5. Auth.
6. Admin shell.
7. Upload endpoint.
8. Image processing pipeline.
9. Photo edit screen.
10. Publish/unpublish.
11. Public gallery.
12. Series pages.
13. Settings.
14. README and polish.
