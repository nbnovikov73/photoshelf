import { prisma } from "@photoshelf/db";
import type { SiteSettings } from "@photoshelf/shared";
import { siteSettings as fallbackSettings } from "./sample-content";

const SITE_SETTINGS_ID = "site-settings";

function emptyToNull(value: string | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function mapSettings(settings: {
  authorBio: string | null;
  authorName: string | null;
  contactEmail: string | null;
  instagramUrl: string | null;
  siteDescription: string | null;
  siteTitle: string;
  telegramUrl: string | null;
}): SiteSettings {
  return {
    authorBio: settings.authorBio ?? undefined,
    authorName: settings.authorName ?? undefined,
    contactEmail: settings.contactEmail ?? undefined,
    instagramUrl: settings.instagramUrl ?? undefined,
    siteDescription: settings.siteDescription ?? undefined,
    siteTitle: settings.siteTitle,
    telegramUrl: settings.telegramUrl ?? undefined
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await prisma.siteSettings.upsert({
      create: {
        authorBio: fallbackSettings.authorBio,
        authorName: fallbackSettings.authorName,
        contactEmail: fallbackSettings.contactEmail,
        id: SITE_SETTINGS_ID,
        instagramUrl: fallbackSettings.instagramUrl,
        siteDescription: fallbackSettings.siteDescription,
        siteTitle: fallbackSettings.siteTitle,
        telegramUrl: fallbackSettings.telegramUrl
      },
      update: {},
      where: {
        id: SITE_SETTINGS_ID
      }
    });

    return mapSettings(settings);
  } catch {
    return fallbackSettings;
  }
}

export async function updateSiteSettings(
  input: Partial<SiteSettings>
): Promise<SiteSettings> {
  const siteTitle = input.siteTitle?.trim() || fallbackSettings.siteTitle;

  const settings = await prisma.siteSettings.upsert({
    create: {
      authorBio: emptyToNull(input.authorBio) ?? fallbackSettings.authorBio,
      authorName: emptyToNull(input.authorName) ?? fallbackSettings.authorName,
      contactEmail: emptyToNull(input.contactEmail),
      id: SITE_SETTINGS_ID,
      instagramUrl: emptyToNull(input.instagramUrl),
      siteDescription:
        emptyToNull(input.siteDescription) ?? fallbackSettings.siteDescription,
      siteTitle,
      telegramUrl: emptyToNull(input.telegramUrl)
    },
    update: {
      authorBio: emptyToNull(input.authorBio),
      authorName: emptyToNull(input.authorName),
      contactEmail: emptyToNull(input.contactEmail),
      instagramUrl: emptyToNull(input.instagramUrl),
      siteDescription: emptyToNull(input.siteDescription),
      siteTitle,
      telegramUrl: emptyToNull(input.telegramUrl)
    },
    where: {
      id: SITE_SETTINGS_ID
    }
  });

  return mapSettings(settings);
}
