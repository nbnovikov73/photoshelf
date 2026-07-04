-- Pin a photo to the public home hero; the latest pin wins.
ALTER TABLE "Photo" ADD COLUMN "pinnedAt" TIMESTAMP(3);
