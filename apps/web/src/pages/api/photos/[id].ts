import { PHOTO_STATUS } from "@photoshelf/shared";
import type { APIRoute } from "astro";
import { jsonError, jsonOk } from "../../../lib/api-response";
import { getAdminPhotoById, updatePhoto } from "../../../lib/photo-repository";
import type { PhotoStatus } from "@photoshelf/shared";

function isPhotoStatus(value: unknown): value is PhotoStatus {
  return value === PHOTO_STATUS.draft || value === PHOTO_STATUS.published;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getTags(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;

  if (!id) {
    return jsonError("PHOTO_ID_REQUIRED", "Photo id is required.", 400);
  }

  const photo = await getAdminPhotoById(id);

  if (!photo) {
    return jsonError("PHOTO_NOT_FOUND", "Photo was not found.", 404);
  }

  return jsonOk({
    photo
  });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id;

  if (!id) {
    return jsonError("PHOTO_ID_REQUIRED", "Photo id is required.", 400);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const status = body.status;

    if (status !== undefined && !isPhotoStatus(status)) {
      return jsonError("INVALID_PHOTO_STATUS", "Photo status is invalid.", 400);
    }

    const photo = await updatePhoto(id, {
      description: getString(body.description),
      pinned: typeof body.pinned === "boolean" ? body.pinned : undefined,
      seriesTitle: getString(body.seriesTitle),
      status,
      tags: getTags(body.tags),
      title: getString(body.title)
    });

    return jsonOk({
      photo
    });
  } catch {
    return jsonError("PHOTO_UPDATE_FAILED", "Could not update photograph.", 400);
  }
};
