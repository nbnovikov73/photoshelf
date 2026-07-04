# PhotoShelf Coding Rules

## 1. Core rule

Always optimize for the central product promise:

> Fast publishing of selected photographs to a personal website.

## 2. Stack constraints

Use Astro, TypeScript, React only for interactive admin islands, PostgreSQL, Prisma, S3-compatible object storage, Sharp, and Docker Compose.

Do not replace Astro with Next.js, Remix, or a full SPA framework unless explicitly instructed.

## 3. Simplicity rules

Prefer fewer dependencies, explicit code, small modules, boring architecture, clear names, predictable APIs, and server-rendered public pages.

Avoid premature abstraction, unnecessary design patterns, generic CMS architecture, plugin systems, multi-tenant logic, social-network features, and heavy UI frameworks unless explicitly approved.

## 4. Astro rules

Use Astro pages and layouts for public pages. Use React components only when client-side interactivity is required.

Good React use cases: upload form, photo preview, editable tag input, admin forms, publish/unpublish controls.

Bad React use cases: static public photo page, static About page, static series grid unless dynamic behavior is required.

## 5. TypeScript rules

All new code must be TypeScript. Avoid `any`. Validate unknown values from APIs, forms, and external libraries.

## 6. Database rules

Use Prisma migrations. Draft photos must never appear in public queries.

## 7. API rules

Success format:

```json
{ "ok": true, "data": {} }
```

Error format:

```json
{ "ok": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

Never expose stack traces to the client.

## 8. Image handling rules

Every uploaded image must go through the image pipeline: validate file type, validate file size, preserve original, normalize orientation, generate web image, generate thumbnail, generate blur placeholder, extract dimensions, extract EXIF when available.

Default status after upload: `DRAFT`.

## 9. Admin UX rules

Admin must be mobile-first. The core flow must stay short:

```txt
Upload → Preview → Edit minimal fields → Publish
```

## 10. Public UI rules

Use large images, restrained typography, generous whitespace, responsive image grids, fast pages, and low visual noise.

Do not add likes, comments, counters, badges, or template-like hero sections.

## 11. Security rules

Never commit secrets. Hash passwords securely. Use HTTP-only cookies for sessions. Validate uploads. Protect admin and mutation routes. Ensure drafts are not publicly accessible.

## 12. Codex working rules

When implementing tasks:

1. Read `PRD.md`.
2. Read `ARCHITECTURE.md`.
3. Read `CODING_RULES.md`.
4. Read `.codex/SKILL.md`.
5. Make the smallest coherent change.
6. Keep Astro as the foundation.
7. Do not introduce features outside MVP unless explicitly asked.
8. Explain important tradeoffs in the final response.
