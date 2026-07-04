import type { APIRoute } from "astro";
import { jsonOk } from "../../../lib/api-response";
import { listAdminPhotos } from "../../../lib/photo-repository";

export const GET: APIRoute = async () => {
  return jsonOk({
    photos: await listAdminPhotos()
  });
};
