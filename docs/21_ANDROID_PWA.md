# Android PWA Install

PhotoShelf is designed so the photographer installs the admin as a phone app.

## Install from Chrome on Android

1. Open `https://your-domain.example/admin` in Chrome.
2. Log in with the admin email and password.
3. Open the Chrome menu.
4. Tap `Add to Home screen` or `Install app`.
5. Confirm the install.

The installed app opens directly to `/admin`, so the normal publishing path is:

```txt
Open PhotoShelf -> Upload -> Preview -> Save draft or Publish
```

## Notes

- HTTPS is required for PWA install prompts.
- The production Caddy setup in this repository requests and renews Let's Encrypt certificates automatically.
- Admin and API pages are not cached by the service worker, so private draft/admin data is not stored for offline browsing.
- Public pages are lightly cached so the photo site still feels fast on mobile.
