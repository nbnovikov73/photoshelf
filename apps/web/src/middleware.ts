import { defineMiddleware } from "astro:middleware";
import { jsonError } from "./lib/api-response";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./lib/auth";

const protectedApiPrefixes = ["/api/photos", "/api/series", "/api/settings"];
const mutationMethods = new Set(["DELETE", "PATCH", "POST", "PUT"]);

function applySecurityHeaders(response: Response): Response {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(), payment=()"
  );

  if (import.meta.env.PROD) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

function hasValidOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set([url.origin]);
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");

  if (forwardedHost) {
    allowedOrigins.add(`${forwardedProto}://${forwardedHost}`);
  }

  return allowedOrigins.has(origin);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginRoute = pathname === "/admin/login";
  const isProtectedApi = protectedApiPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (mutationMethods.has(context.request.method) && !hasValidOrigin(context.request, context.url)) {
    return applySecurityHeaders(
      jsonError("INVALID_ORIGIN", "Request origin is not allowed.", 403)
    );
  }

  if ((isAdminRoute && !isLoginRoute) || isProtectedApi) {
    const session = context.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!verifySessionToken(session)) {
      if (isProtectedApi) {
        return applySecurityHeaders(
          jsonError("UNAUTHORIZED", "Authentication is required.", 401)
        );
      }

      return applySecurityHeaders(context.redirect("/admin/login", 302));
    }
  }

  return applySecurityHeaders(await next());
});
