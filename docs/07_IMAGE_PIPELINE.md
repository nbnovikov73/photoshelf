# Image Pipeline

Upload pipeline:

1. Receive file.
2. Validate authentication.
3. Validate MIME type.
4. Validate file size.
5. Store original.
6. Extract EXIF.
7. Normalize orientation.
8. Generate large web image.
9. Generate thumbnail.
10. Generate blur placeholder.
11. Save photo as draft.
12. Return draft to admin.

Variants: original upload, large max width 2400 px, thumbnail max width 600 px, tiny blurred base64 placeholder.

Never expose draft photos publicly. Never overwrite originals. Never use raw filenames as storage keys.
