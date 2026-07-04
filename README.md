# PhotoShelf

PhotoShelf is an Astro-first personal photography publishing system.

It exists for one reason:

> Publish a carefully selected photograph to your own website from your phone with almost Instagram-level simplicity.

PhotoShelf is not a social network, not a generic CMS, and not a portfolio template. It is a quiet, fast, editorial publishing tool for photographers who want to own their archive.

## Current MVP scaffold

This repository now contains the first working scaffold:

- Astro app in `apps/web`
- Public pages: `/`, `/about`, `/series`, `/photos`
- Public detail pages: `/series/[slug]`, `/photos/[slug]`
- Admin pages: `/admin`, `/admin/login`, `/admin/photos`, `/admin/photos/new`
- React island only for the interactive new-photo preview form
- Prisma schema in `packages/db`
- Reproducible initial Prisma migration
- Shared types, constants, and validators in `packages/shared`
- PostgreSQL and MinIO in Docker Compose
- Upload pipeline: validate image, store original, generate WebP variants, create blur placeholder, extract basic EXIF, save as draft
- Explicit publish/unpublish API
- Editable About/site settings from `/admin/settings`
- Mobile-first editorial/noir visual system with plain CSS

The app still keeps the first version intentionally small: no social features, no registration, no multi-user mode, and no complex CMS workflows.

## Stack

- Astro
- TypeScript
- React islands for admin interactivity only
- PostgreSQL
- Prisma
- S3-compatible storage
- MinIO for local development
- Sharp
- Docker Compose

## Local setup

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:generate
npm run db:migrate
npm run dev
```

The web app runs at:

```txt
http://localhost:4321
```

MinIO console runs at:

```txt
http://localhost:9001
```

Default development admin credentials are read from `.env`:

```txt
ADMIN_EMAIL=admin@photoshelf.local
ADMIN_INITIAL_PASSWORD=change-me-before-real-use
```

For a safer local setup, set `ADMIN_PASSWORD_HASH` to a bcrypt hash and remove reliance on the initial plaintext password.

On first successful login with `ADMIN_INITIAL_PASSWORD`, PhotoShelf creates the admin user in PostgreSQL with a bcrypt password hash. Uploaded photographs are saved as `DRAFT` first. The admin UI may then explicitly publish them.

## Useful commands

```bash
npm run dev
npm run build
npm run preview
npm run check
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:studio
docker compose up -d
docker compose ps
docker compose down
```

## Android PWA

The installable phone app starts at `/admin`.

1. Deploy PhotoShelf over HTTPS.
2. Open `https://your-domain.example/admin` in Chrome on Android.
3. Use Chrome menu -> `Add to Home screen` or `Install app`.

More detail: `docs/21_ANDROID_PWA.md`.

## VPS deploy

Production is designed for a single Ubuntu VPS with Docker Compose, Caddy, PostgreSQL, and MinIO.

One-command install shape:

```bash
sudo env DOMAIN=photos.example.com ADMIN_EMAIL=me@example.com REPO_URL=https://github.com/nbnovikov73/photoshelf.git bash -c "$(curl -fsSL https://raw.githubusercontent.com/nbnovikov73/photoshelf/main/scripts/vps-install.sh)"
```

More detail: `docs/22_VPS_DEPLOYMENT.md`.

## Product rule

Every implementation decision should protect the core flow:

```txt
Upload -> Preview -> Edit minimal metadata -> Publish
```

Draft photos must never appear in public queries or public pages.

## Project documents

Read these before implementing product changes:

1. `PRD.md`
2. `ARCHITECTURE.md`
3. `CODING_RULES.md`
4. `.codex/SKILL.md`
5. `docs/00_PRODUCT_VISION.md`
6. `docs/03_UX_BIBLE.md`
7. `docs/07_IMAGE_PIPELINE.md`
8. `docs/11_SECURITY.md`
