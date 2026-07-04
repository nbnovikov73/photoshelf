# VPS Deployment

PhotoShelf can run on a single Ubuntu VPS with Docker Compose, Caddy, PostgreSQL, and MinIO.

The production deployment keeps only ports `80`, `443`, and SSH public. PostgreSQL and MinIO stay inside the Docker network. Caddy terminates HTTPS with Let's Encrypt and proxies public media from MinIO under `/media`.

## VPS requirements

- Ubuntu 22.04 or newer.
- A domain with an `A` record pointing to the VPS public IP.
- Root or sudo access.
- Ports `80` and `443` reachable from the internet.

## One-command install

Replace the values and run this on the VPS:

```bash
sudo env DOMAIN=photos.example.com ADMIN_EMAIL=me@example.com REPO_URL=https://github.com/nbnovikov73/photoshelf.git bash -c "$(curl -fsSL https://raw.githubusercontent.com/nbnovikov73/photoshelf/main/scripts/vps-install.sh)"
```

The installer:

- installs Docker, Docker Compose plugin, UFW, and fail2ban;
- opens only SSH, HTTP, and HTTPS;
- clones or updates the repository in `/opt/photoshelf`;
- generates `.env.production` with strong random secrets;
- builds and starts the production stack;
- runs Prisma migrations with `migrate deploy`;
- prints the initial admin password once.

## Production commands

From `/opt/photoshelf`:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f web
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T web npm run db:deploy
```

## Security baseline

- HTTPS is automatic through Caddy and Let's Encrypt.
- Caddy adds security headers and limits request bodies to 35 MB.
- The app validates upload MIME type and size.
- Admin routes and mutation APIs require an HTTP-only session cookie.
- Login and upload endpoints have simple in-memory rate limits.
- Same-origin checks reject cross-site mutation requests with a mismatched `Origin`.
- Draft photos are never returned by public queries.
- PostgreSQL and MinIO are not exposed as public ports in production.

## Backups

Back up these Docker volumes:

- `photoshelf_postgres-data`
- `photoshelf_minio-data`
- `photoshelf_caddy-data`

Also keep a secure copy of `/opt/photoshelf/.env.production`.
