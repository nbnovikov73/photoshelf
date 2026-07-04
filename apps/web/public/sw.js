const CACHE_NAME = "photoshelf-v2";
const SHARE_CACHE = "photoshelf-share";
const SHARED_PHOTO_KEY = "/shared-photo";
const PUBLIC_CACHE_URLS = [
  "/",
  "/about",
  "/photos",
  "/series",
  "/manifest.webmanifest",
  "/icons/photoshelf-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PUBLIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== SHARE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (file && typeof file === "object") {
      const cache = await caches.open(SHARE_CACHE);
      await cache.put(
        SHARED_PHOTO_KEY,
        new Response(file, {
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "X-File-Name": encodeURIComponent(file.name || "shared-photo")
          }
        })
      );
    }
  } catch {
    // fall through to the upload screen without a preselected file
  }

  return Response.redirect("/admin/photos/new?shared=1", 303);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method === "POST" &&
    url.origin === self.location.origin &&
    url.pathname === "/admin/share"
  ) {
    event.respondWith(handleShareTarget(request));
    return;
  }

  if (request.method !== "GET") {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
