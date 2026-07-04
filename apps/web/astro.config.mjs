import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// Baked in at build time (Docker build arg). Without an allowedDomains entry
// Astro ignores X-Forwarded-Proto/Host from the reverse proxy, the request URL
// stays http:// and the built-in CSRF origin check rejects all POSTs.
const domain = process.env.DOMAIN;

export default defineConfig({
  adapter: node({
    mode: "standalone"
  }),
  integrations: [react()],
  output: "server",
  security: {
    allowedDomains: domain
      ? [{ hostname: domain }, { hostname: "localhost" }]
      : [{ hostname: "**" }]
  },
  vite: {
    cacheDir: "../../.cache/vite-web",
    ssr: {
      external: ["@prisma/client", ".prisma/client"]
    }
  }
});
