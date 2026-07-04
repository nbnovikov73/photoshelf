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
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();

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

  // fetch() cannot report upload progress, so the upload goes through XHR
  async function uploadWithProgress(body: FormData): Promise<PhotoSummary> {
    const maxAttempts = 3;

    for (let attempt = 1; ; attempt += 1) {
      try {
        return await uploadAttempt(body);
      } catch (error) {
        const isNetworkError = error instanceof Error && error.name === "UploadNetworkError";

        if (!isNetworkError || attempt >= maxAttempts) {
          throw error;
        }

        // mobile connections drop mid-upload (VPN flaps, Wi-Fi/LTE handover) — retry
        setMessage(`Connection lost. Retrying (${attempt + 1}/${maxAttempts})...`);
        setUploadProgress(0);
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500));
      }
    }
  }

  function uploadAttempt(body: FormData): Promise<PhotoSummary> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", "/api/photos/upload");
      xhr.responseType = "json";

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        const percent = Math.round((event.loaded / event.total) * 100);

        setUploadProgress(percent);
        setMessage(percent < 100 ? `Uploading... ${percent}%` : "Processing...");
      };

      xhr.onload = () => {
        const payload = xhr.response as PhotoApiResponse | null;

        if (payload?.ok) {
          resolve(payload.data.photo);
        } else {
          reject(
            new Error(payload && !payload.ok ? payload.error.message : "Could not upload photograph.")
          );
        }
      };

      xhr.onerror = () => {
        const networkError = new Error("Network error. Check the connection and try again.");
        networkError.name = "UploadNetworkError";
        reject(networkError);
      };
      xhr.send(body);
    });
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
    setUploadProgress(0);

    try {
      const body = new FormData();
      body.set("file", selectedFile);
      body.set("title", title);
      body.set("description", description);
      body.set("seriesTitle", seriesTitle);
      body.set("tags", tagsInput);

      const draftPhoto = await uploadWithProgress(body);
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
          ? "Published. Opening photos..."
          : "Draft saved. Opening photos..."
      );
      window.location.assign("/admin/photos");
    } catch (error) {
      setUploadProgress(undefined);
      setMessage(error instanceof Error ? error.message : "Could not save photograph.");
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

        {uploadProgress !== undefined && (
          <div aria-hidden="true" className="upload-progress">
            <span style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
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
