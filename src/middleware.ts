import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  // Accept either the short-lived accessToken OR the sessionActive marker
  // (same max-age as the refresh token). If sessionActive is present, the
  // client-side interceptor will call /auth/refresh and recover the accessToken
  // transparently. Only redirect when neither cookie exists (no session at all).
  const hasSession =
    request.cookies.get("accessToken")?.value ||
    request.cookies.get("sessionActive")?.value;

  if (!isPublic && pathname.startsWith("/dashboard") && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/forgot-password"],
};
