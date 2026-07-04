import { PHOTO_STATUS } from "@photoshelf/shared";
import type { SyntheticEvent } from "react";
import { useState } from "react";
import type { PhotoSummary } from "@photoshelf/shared";

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

interface Props {
  photo: PhotoSummary;
}

async function readPhotoResponse(response: Response): Promise<PhotoSummary> {
  const payload = (await response.json()) as PhotoApiResponse;

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data.photo;
}

export default function PhotoEditor({ photo: initialPhoto }: Props) {
  const [photo, setPhoto] = useState<PhotoSummary>(initialPhoto);
  const [title, setTitle] = useState<string>(initialPhoto.title);
  const [description, setDescription] = useState<string>(initialPhoto.description ?? "");
  const [seriesTitle, setSeriesTitle] = useState<string>(initialPhoto.series?.title ?? "");
  const [tagsInput, setTagsInput] = useState<string>(initialPhoto.tags.join(", "));
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isPublished = photo.status === PHOTO_STATUS.published;

  async function handleSave(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Saving...");

    try {
      const updated = await readPhotoResponse(
        await fetch(`/api/photos/${photo.id}`, {
          body: JSON.stringify({
            description,
            seriesTitle,
            tags: tagsInput
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            title
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "PATCH"
        })
      );

      setPhoto(updated);
      setMessage("Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save changes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePinToggle() {
    setIsSubmitting(true);
    setMessage(photo.pinned ? "Unpinning..." : "Pinning...");

    try {
      const updated = await readPhotoResponse(
        await fetch(`/api/photos/${photo.id}`, {
          body: JSON.stringify({ pinned: !photo.pinned }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "PATCH"
        })
      );

      setPhoto(updated);
      setMessage(
        updated.pinned
          ? "Pinned. This photograph now opens the home page."
          : "Unpinned. The home page shows the latest photograph."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not change the pin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublishToggle() {
    setIsSubmitting(true);
    setMessage(isPublished ? "Unpublishing..." : "Publishing...");

    try {
      const updated = await readPhotoResponse(
        await fetch(`/api/photos/${photo.id}/${isPublished ? "unpublish" : "publish"}`, {
          method: "POST"
        })
      );

      setPhoto(updated);
      setMessage(updated.status === PHOTO_STATUS.published ? "Published." : "Moved to drafts.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not change status.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="draft-composer" onSubmit={handleSave}>
      <div className="upload-drop upload-drop--static">
        <img alt={photo.title} src={photo.imageUrl} />
      </div>

      <div className="form-grid">
        <div className="field">
          <span>Status</span>
          <div className="form-actions">
            <span
              className={
                isPublished ? "status-pill status-pill--published" : "status-pill"
              }
            >
              {isPublished ? "Published" : "Draft"}
            </span>
            {photo.pinned && <span className="status-pill status-pill--pinned">Hero</span>}
            {isPublished && (
              <a className="button button--ghost" href={`/photos/${photo.slug}`}>
                View public page
              </a>
            )}
          </div>
        </div>

        <label className="field">
          <span>Title</span>
          <input
            autoComplete="off"
            onChange={(event) => setTitle(event.currentTarget.value)}
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

        <div className="form-actions">
          <button className="button button--accent" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Working..." : "Save changes"}
          </button>
          <button
            className="button button--ghost"
            disabled={isSubmitting}
            onClick={handlePublishToggle}
            type="button"
          >
            {isPublished ? "Unpublish" : "Publish"}
          </button>
          <button
            className="button button--ghost"
            disabled={isSubmitting}
            onClick={handlePinToggle}
            type="button"
          >
            {photo.pinned ? "Unpin from hero" : "Pin to hero"}
          </button>
        </div>

        {message && <p className="muted">{message}</p>}
      </div>
    </form>
  );
}
