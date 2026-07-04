import type { APIRoute } from "astro";
import {
  createSessionToken,
  isValidAdminCredential,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS
} from "../../../lib/auth";
import { getClientIp } from "../../../lib/request-ip";
import { isRateLimited } from "../../../lib/rate-limit";

export const POST: APIRoute = async ({ clientAddress, cookies, redirect, request }) => {
  const ip = getClientIp(request, clientAddress);

  if (
    isRateLimited(`login:${ip}`, {
      limit: 8,
      windowMs: 15 * 60 * 1000
    })
  ) {
    return redirect("/admin/login?error=rate", 303);
  }

  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const isValid = await isValidAdminCredential(email, password);

  if (!isValid) {
    return redirect("/admin/login?error=1", 303);
  }

  cookies.set(SESSION_COOKIE_NAME, createSessionToken(email), {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: import.meta.env.PROD
  });

  return redirect("/admin", 303);
};
