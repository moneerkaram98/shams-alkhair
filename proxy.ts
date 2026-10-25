import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Launch guard for a school holding minors' and women's private information.
 * Production API routes fail closed until the school explicitly completes
 * the database/role/security acceptance checklist and sets SCHOOL_LIVE_READY.
 * This guard is defense in depth; route-level authorization must remain.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();
  if (request.nextUrl.pathname === "/login" && process.env.NODE_ENV === "production" && process.env.SCHOOL_LIVE_READY !== "true")
    return NextResponse.redirect(new URL("/", request.url));

  // Preserve local development and the disposable CI test environment.
  if (process.env.NODE_ENV !== "production" || process.env.SCHOOL_LIVE_READY === "true")
    return NextResponse.next();

  return NextResponse.json(
    { error: "SCHOOL_NOT_ACTIVATED", message: "المنصة قيد التجهيز ولا تستقبل بيانات شخصية حاليًا" },
    { status: 503, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}

export const config = { matcher: ["/api/:path*", "/login"] };
