import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getOptionalEnv, getRequiredEnv } from "./env";

let client: S3Client | undefined;

function getS3Client(): S3Client {
  client ??= new S3Client({
    credentials: {
      accessKeyId: getRequiredEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("S3_SECRET_ACCESS_KEY")
    },
    endpoint: getRequiredEnv("S3_ENDPOINT"),
    forcePathStyle: true,
    region: getOptionalEnv("S3_REGION", "us-east-1")
  });

  return client;
}

export function getPublicObjectUrl(key: string): string {
  const baseUrl = getRequiredEnv("S3_PUBLIC_BASE_URL").replace(/\/$/, "");
  const encodedKey = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${baseUrl}/${encodedKey}`;
}

export async function putObject(params: {
  body: Buffer;
  cacheControl?: string;
  contentType: string;
  key: string;
}): Promise<string> {
  await getS3Client().send(
    new PutObjectCommand({
      Body: params.body,
      Bucket: getRequiredEnv("S3_BUCKET"),
      CacheControl: params.cacheControl ?? "public, max-age=31536000, immutable",
      ContentType: params.contentType,
      Key: params.key
    })
  );

  return getPublicObjectUrl(params.key);
}
