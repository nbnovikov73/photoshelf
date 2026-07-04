import type { APIRoute } from "astro";
import { jsonError, jsonOk } from "../../../lib/api-response";
import { processPhotoUpload } from "../../../lib/image-pipeline";
import { getClientIp } from "../../../lib/request-ip";
import { isRateLimited } from "../../../lib/rate-limit";

const safeUploadMessages = new Set([
  "A photograph file is required.",
  "Only JPEG, PNG, and WebP files are supported."
]);

export const POST: APIRoute = async ({ clientAddress, request }) => {
  const ip = getClientIp(request, clientAddress);

  if (
    isRateLimited(`upload:${ip}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000
    })
  ) {
    return jsonError("RATE_LIMITED", "Too many uploads. Wait a few minutes.", 429);
  }

  try {
    const formData = await request.formData();
    const photo = await processPhotoUpload(formData);

    return jsonOk({
      photo
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isSafeSizeError = /^Upload must be \d+ MB or smaller\.$/.test(message);

    return jsonError(
      "PHOTO_UPLOAD_FAILED",
      safeUploadMessages.has(message) || isSafeSizeError
        ? message
        : "Could not upload photograph.",
      400
    );
  }
};
