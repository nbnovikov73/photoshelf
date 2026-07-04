#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/photoshelf}"
DOMAIN="${DOMAIN:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-$ADMIN_EMAIL}"
REPO_URL="${REPO_URL:-}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root, for example: sudo env DOMAIN=... ADMIN_EMAIL=... bash scripts/vps-install.sh" >&2
  exit 1
fi

if [ -z "$DOMAIN" ] || [ -z "$ADMIN_EMAIL" ]; then
  echo "DOMAIN and ADMIN_EMAIL are required." >&2
  echo "Example: sudo env DOMAIN=photos.example.com ADMIN_EMAIL=me@example.com REPO_URL=https://github.com/nbnovikov73/photoshelf.git bash scripts/vps-install.sh" >&2
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl fail2ban git openssl ufw

if ! command -v docker >/dev/null 2>&1; then
  # docker-compose-plugin exists in Docker's own apt repo; Ubuntu ships docker-compose-v2
  apt-get install -y docker.io docker-compose-plugin \
    || apt-get install -y docker.io docker-compose-v2
fi

systemctl enable --now docker
systemctl enable --now fail2ban

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

if [ ! -d "$APP_DIR/.git" ]; then
  if [ -z "$REPO_URL" ]; then
    echo "REPO_URL is required for a fresh server install." >&2
    exit 1
  fi
  git clone "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --ff-only
fi

cd "$APP_DIR"

POSTGRES_PASSWORD="$(openssl rand -base64 36 | tr -d '\n')"
SESSION_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
MINIO_ROOT_USER="photoshelf$(openssl rand -hex 4)"
MINIO_ROOT_PASSWORD="$(openssl rand -base64 36 | tr -d '\n')"
ADMIN_INITIAL_PASSWORD="${ADMIN_INITIAL_PASSWORD:-$(openssl rand -base64 18 | tr -d '\n')}"

if [ ! -f .env.production ]; then
  cat > .env.production <<EOF
DOMAIN=$DOMAIN
LETSENCRYPT_EMAIL=$LETSENCRYPT_EMAIL

DATABASE_URL=postgresql://photoshelf:$POSTGRES_PASSWORD@postgres:5432/photoshelf?schema=public
POSTGRES_USER=photoshelf
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=photoshelf

SESSION_SECRET=$SESSION_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_INITIAL_PASSWORD=$ADMIN_INITIAL_PASSWORD
ADMIN_PASSWORD_HASH=

S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=photoshelf
S3_ACCESS_KEY_ID=$MINIO_ROOT_USER
S3_SECRET_ACCESS_KEY=$MINIO_ROOT_PASSWORD
S3_PUBLIC_BASE_URL=https://$DOMAIN/media/photoshelf
MINIO_ROOT_USER=$MINIO_ROOT_USER
MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD

MAX_UPLOAD_MB=30
EOF
  chmod 600 .env.production
fi

docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T web npm run db:deploy

echo ""
echo "PhotoShelf is deployed at: https://$DOMAIN"
echo "Admin email: $ADMIN_EMAIL"
echo "Initial admin password: $ADMIN_INITIAL_PASSWORD"
echo ""
echo "Save the initial password now. It is only printed during installation."
