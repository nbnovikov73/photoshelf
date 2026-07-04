# Deployment Guide

MVP must run locally with Docker Compose. Required services: web, postgres, minio.

Production can later run on VPS with Docker, managed PostgreSQL, and S3-compatible object storage.

Local setup goal:

```bash
cp .env.example .env
docker compose up
```
