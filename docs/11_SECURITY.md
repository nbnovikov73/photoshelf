# Security Rules

MVP security requirements: hash passwords with bcrypt or argon2, use HTTP-only session cookies, protect all admin routes, validate upload MIME types, enforce max file size, reject unsupported files, do not expose draft photos publicly, never commit secrets, and do not leak stack traces.

PhotoShelf stores photographs and metadata. Treat unpublished drafts as private content.
