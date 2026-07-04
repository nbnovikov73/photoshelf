import type { SyntheticEvent } from "react";
import { useState } from "react";
import type { SiteSettings } from "@photoshelf/shared";

type SettingsApiResponse =
  | {
      ok: true;
      data: {
        settings: SiteSettings;
      };
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };

interface Props {
  initialSettings: SiteSettings;
}

export default function SiteSettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [message, setMessage] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  function updateField(name: keyof SiteSettings, value: string) {
    setSettings((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("Saving...");

    try {
      const response = await fetch("/api/settings", {
        body: JSON.stringify(settings),
        headers: {
          "Content-Type": "application/json"
        },
        method: "PATCH"
      });
      const payload = (await response.json()) as SettingsApiResponse;

      if (!payload.ok) {
        throw new Error(payload.error.message);
      }

      setSettings(payload.data.settings);
      setMessage("Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="field">
        <span>Site title</span>
        <input
          autoComplete="off"
          onChange={(event) => updateField("siteTitle", event.currentTarget.value)}
          required
          type="text"
          value={settings.siteTitle}
        />
      </label>

      <label className="field">
        <span>Short site description</span>
        <textarea
          onChange={(event) => updateField("siteDescription", event.currentTarget.value)}
          placeholder="One sentence for the public site."
          value={settings.siteDescription ?? ""}
        />
      </label>

      <label className="field">
        <span>Author name</span>
        <input
          autoComplete="name"
          onChange={(event) => updateField("authorName", event.currentTarget.value)}
          placeholder="Name shown on About"
          type="text"
          value={settings.authorName ?? ""}
        />
      </label>

      <label className="field">
        <span>About text</span>
        <textarea
          onChange={(event) => updateField("authorBio", event.currentTarget.value)}
          placeholder="A quiet bio or manifesto for the About page."
          value={settings.authorBio ?? ""}
        />
      </label>

      <label className="field">
        <span>Contact email</span>
        <input
          autoComplete="email"
          onChange={(event) => updateField("contactEmail", event.currentTarget.value)}
          placeholder="Optional"
          type="email"
          value={settings.contactEmail ?? ""}
        />
      </label>

      <label className="field">
        <span>Instagram URL</span>
        <input
          autoComplete="url"
          onChange={(event) => updateField("instagramUrl", event.currentTarget.value)}
          placeholder="Optional"
          type="url"
          value={settings.instagramUrl ?? ""}
        />
      </label>

      <label className="field">
        <span>Telegram URL</span>
        <input
          autoComplete="url"
          onChange={(event) => updateField("telegramUrl", event.currentTarget.value)}
          placeholder="Optional"
          type="url"
          value={settings.telegramUrl ?? ""}
        />
      </label>

      <div className="form-actions">
        <button className="button button--accent" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : "Save About"}
        </button>
        <a className="button button--ghost" href="/about">
          View About
        </a>
      </div>

      {message && <p className="muted">{message}</p>}
    </form>
  );
}
