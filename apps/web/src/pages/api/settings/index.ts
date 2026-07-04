import type { APIRoute } from "astro";
import { jsonError, jsonOk } from "../../../lib/api-response";
import { getSiteSettings, updateSiteSettings } from "../../../lib/settings-repository";
import type { SiteSettings } from "@photoshelf/shared";

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export const GET: APIRoute = async () => {
  return jsonOk({
    settings: await getSiteSettings()
  });
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input: Partial<SiteSettings> = {
      authorBio: getString(body.authorBio),
      authorName: getString(body.authorName),
      contactEmail: getString(body.contactEmail),
      instagramUrl: getString(body.instagramUrl),
      siteDescription: getString(body.siteDescription),
      siteTitle: getString(body.siteTitle),
      telegramUrl: getString(body.telegramUrl)
    };
    const settings = await updateSiteSettings(input);

    return jsonOk({
      settings
    });
  } catch {
    return jsonError("SETTINGS_UPDATE_FAILED", "Could not update settings.", 400);
  }
};
