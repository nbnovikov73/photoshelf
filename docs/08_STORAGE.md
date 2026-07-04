# Storage Strategy

Use S3-compatible object storage. Local development uses MinIO. Production can use Selectel Object Storage, AWS S3, Cloudflare R2, or another S3-compatible provider.

Object key pattern:

```txt
photos/{photoId}/original.{ext}
photos/{photoId}/large.webp
photos/{photoId}/thumb.webp
```

Database stores metadata and URLs. Object storage stores binary image files. Originals are preserved.
