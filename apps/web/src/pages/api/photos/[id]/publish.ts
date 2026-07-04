import type { APIRoute } from "astro";
import { jsonError, jsonOk } from "../../../../lib/api-response";
import { publishPhoto } from "../../../../lib/photo-repository";

export const POST: APIRoute = async ({ params }) => {
  const id = params.id;

  if (!id) {
    return jsonError("PHOTO_ID_REQUIRED", "Photo id is required.", 400);
  }

  try {
    const photo = await publishPhoto(id);

    return jsonOk({
      photo
    });
  } catch {
    return jsonError("PHOTO_PUBLISH_FAILED", "Could not publish photograph.", 400);
  }
};
