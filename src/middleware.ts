import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "rm_token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect dashboard pages
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
