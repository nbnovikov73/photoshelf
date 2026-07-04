# Database Conventions

Use PostgreSQL with Prisma. Use migrations, explicit enums, stable IDs, `createdAt`, and `updatedAt`.

Public queries must always filter `status = PUBLISHED`. Admin queries may show drafts.

Avoid soft delete unless required.
