import { PHOTO_STATUS, isSupportedImageMimeType, isWithinUploadLimit } from "@photoshelf/shared";
import type { ChangeEvent, SyntheticEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { PhotoStatus, PhotoSummary } from "@photoshelf/shared";

const maxUploadMb = 30;

type PhotoApiResponse =
  | {
      ok: true;
      data: {
        photo: PhotoSummary;
      };
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };

export default function PhotoDraftComposer() {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [fileName, setFileName] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [seriesTitle, setSeriesTitle] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [status, setStatus] = useState<PhotoStatus>(PHOTO_STATUS.draft);
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [savedPhoto, setSavedPhoto] = useState<PhotoSummary | undefined>();

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function applyFile(file: File) {
    if (!isSupportedImageMimeType(file.type)) {
      setMessage("Use JPEG, PNG, or WebP.");
      return;
    }

    if (!isWithinUploadLimit(file.size, maxUploadMb)) {
      setMessage(`Keep the file under ${maxUploadMb} MB.`);
      return;
    }

    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return URL.createObjectURL(file);
    });
    setSelectedFile(file);
    setFileName(file.name);
    setMessage("");
    setSavedPhoto(undefined);
    setTitle((current) => current || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  }

  // photo handed over by the Android share sheet (see share_target + sw.js)
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("shared")) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const cache = await caches.open("photoshelf-share");
        const stored = await cache.match("/shared-photo");

        if (!stored || cancelled) {
          return;
        }

        const blob = await stored.blob();
        const storedName = stored.headers.get("X-File-Name");
        const name = storedName ? decodeURIComponent(storedName) : "shared-photo.jpg";

        await cache.delete("/shared-photo");

        if (!cancelled) {
          applyFile(new File([blob], name, { type: blob.type }));
        }
      } catch {
        // no shared photo to pick up
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    applyFile(file);
  }

  async function readPhotoResponse(response: Response): Promise<PhotoSummary> {
    const payload = (await response.json()) as PhotoApiResponse;

    if (!payload.ok) {
      throw new Error(payload.error.message);
    }

    return payload.data.photo;
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setMessage("Choose a photograph first.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Uploading...");
    setSavedPhoto(undefined);

    try {
      const body = new FormData();
      body.set("file", selectedFile);
      body.set("title", title);
      body.set("description", description);
      body.set("seriesTitle", seriesTitle);
      body.set("tags", tagsInput);

      const uploadResponse = await fetch("/api/photos/upload", {
        body,
        method: "POST"
      });
      const draftPhoto = await readPhotoResponse(uploadResponse);
      const finalPhoto =
        status === PHOTO_STATUS.published
          ? await readPhotoResponse(
              await fetch(`/api/photos/${draftPhoto.id}/publish`, {
                method: "POST"
              })
            )
          : draftPhoto;

      setSavedPhoto(finalPhoto);
      setMessage(
        finalPhoto.status === PHOTO_STATUS.published
          ? "Published."
          : "Draft saved."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save photograph.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="draft-composer" onSubmit={handleSubmit}>
      <label className="upload-drop">
        {previewUrl ? (
          <img alt={title || fileName || "Selected photograph"} src={previewUrl} />
        ) : (
          <span>
            <strong>Choose photograph</strong>
            <br />
            JPEG, PNG, or WebP up to {maxUploadMb} MB
          </span>
        )}
        <input accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} type="file" />
      </label>

      <div className="form-grid">
        <label className="field">
          <span>Title</span>
          <input
            autoComplete="off"
            onChange={(event) => setTitle(event.currentTarget.value)}
            placeholder="Untitled photograph"
            type="text"
            value={title}
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            onChange={(event) => setDescription(event.currentTarget.value)}
            placeholder="One quiet line is enough."
            value={description}
          />
        </label>

        <label className="field">
          <span>Series</span>
          <input
            autoComplete="off"
            onChange={(event) => setSeriesTitle(event.currentTarget.value)}
            placeholder="Optional"
            type="text"
            value={seriesTitle}
          />
        </label>

        <label className="field">
          <span>Tags</span>
          <input
            autoComplete="off"
            onChange={(event) => setTagsInput(event.currentTarget.value)}
            placeholder="portrait, night, concrete"
            type="text"
            value={tagsInput}
          />
        </label>

        <div className="field">
          <span>Visibility</span>
          <div className="segmented-control" role="group" aria-label="Visibility">
            <button
              aria-pressed={status === PHOTO_STATUS.draft}
              onClick={() => setStatus(PHOTO_STATUS.draft)}
              type="button"
            >
              Draft
            </button>
            <button
              aria-pressed={status === PHOTO_STATUS.published}
              onClick={() => setStatus(PHOTO_STATUS.published)}
              type="button"
            >
              Publish
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button className="button button--accent" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Saving..."
              : status === PHOTO_STATUS.published
                ? "Upload and publish"
                : "Save draft"}
          </button>
          {tags.length > 0 && <span className="muted">{tags.length} tags</span>}
        </div>

        {message && <p className="muted">{message}</p>}
        {savedPhoto && (
          <div className="form-actions">
            <a className="button button--ghost" href="/admin/photos">
              View admin list
            </a>
            {savedPhoto.status === PHOTO_STATUS.published && (
              <a className="button button--ghost" href={`/photos/${savedPhoto.slug}`}>
                View public page
              </a>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
