# PhotoShelf PRD

## 1. Product vision

PhotoShelf is a personal photography publishing system. It is a fast personal publishing tool for a photographer who wants to publish selected photographs on their own website with the same low friction as posting to Instagram.

Core product promise:

> Publish a photograph to your own website from your phone in the fewest possible steps.

## 2. Primary user

The first user is a hobby photographer with strong visual taste who wants a personal photography site, simple mobile publishing, strong visual presentation, control over image storage and metadata, and no dependence on Instagram as the only archive.

The visual direction is influenced by Helmut Newton, Richard Avedon, Peter Lindbergh, black-and-white editorial photography, industrial architecture, and Japanese noir/urban aesthetics.

## 3. Product principles

1. Publishing speed is the main feature.
2. The product should feel like a private tool, not a social network.
3. The public site must make photographs look important.
4. The admin interface must work well from a phone.
5. The first version must stay small.
6. Every new feature must reduce friction or improve presentation.
7. Do not add social mechanics in MVP.

## 4. MVP scope

MVP must support one user, password authentication, mobile-friendly admin, photograph upload, image optimization, EXIF extraction, draft/published status, series management, tag management, public gallery, series pages, individual photo pages, About page, and basic site settings.

## 5. Non-goals for MVP

Do not build multi-user accounts, public registration, likes, comments, followers, subscriptions, payments, marketplace, native mobile app, complex CMS workflows, advanced role management, or required AI generation.

## 6. Core user journey

1. User opens PhotoShelf admin from phone.
2. User taps Upload.
3. User selects one photograph.
4. System uploads the file.
5. System creates optimized image variants.
6. System extracts EXIF metadata.
7. User sees a preview.
8. User enters or edits title, description, series, tags, and visibility.
9. User taps Publish.
10. Photograph appears on the public site.

The final product may later support Android/iOS share sheet integration. For MVP, a mobile PWA upload screen is sufficient.

## 7. Main entities

Photo: id, title, slug, description, original URL, optimized URL, thumbnail URL, blur placeholder, width, height, aspect ratio, status, published date, taken date, EXIF metadata, series, tags.

Series: id, title, slug, description, cover photo, sort order.

Tag: id, name, slug.

## 8. Public site requirements

The public site must be built with Astro.

Required pages: Home, Photo page, Series index, Series detail, About.

The Home page shows site title, short visual manifesto, latest published photographs, selected series, and link to About.

The Photo page shows large image, title, description, publication date, series, tags, and selected EXIF data if available.

## 9. Admin requirements

The admin area must be responsive and optimized for mobile.

Required screens: Login, Dashboard, Upload photo, Edit photo, Series manager, Settings.

## 10. Image processing requirements

When a photo is uploaded, the system must store the original file, generate a web-optimized image, generate a thumbnail, generate a low-quality blur placeholder, extract width and height, extract EXIF metadata when available, preserve orientation correctly, reject unsupported formats, and enforce maximum file size.

Supported formats: JPEG, PNG, WebP. Recommended max upload size: 30 MB.

## 11. UX requirements

Admin must be usable with one hand on a phone. Use a large Upload button, minimal required fields, sensible defaults, draft-first behavior, explicit publishing, no unnecessary modals, and no desktop-only workflows.

## 12. MVP acceptance criteria

1. Project runs locally with Docker Compose.
2. Public site runs on Astro.
3. Admin works from a phone-sized viewport.
4. User can log in.
5. User can upload one photo.
6. System generates optimized image variants.
7. System extracts basic EXIF.
8. User can edit title, description, series, tags, and status.
9. User can publish a photo.
10. Published photo appears on the public home page.
11. Published photo has its own public page.
12. Series pages work.
13. Draft photos are not publicly visible.
14. README contains clear local setup instructions.
