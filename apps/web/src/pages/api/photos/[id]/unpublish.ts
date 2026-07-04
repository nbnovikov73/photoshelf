import type { APIRoute } from "astro";
import { jsonError, jsonOk } from "../../../../lib/api-response";
import { unpublishPhoto } from "../../../../lib/photo-repository";

export const POST: APIRoute = async ({ params }) => {
  const id = params.id;

  if (!id) {
    return jsonError("PHOTO_ID_REQUIRED", "Photo id is required.", 400);
  }

  try {
    const photo = await unpublishPhoto(id);

    return jsonOk({
      photo
    });
  } catch {
    return jsonError("PHOTO_UNPUBLISH_FAILED", "Could not unpublish photograph.", 400);
  }
};
