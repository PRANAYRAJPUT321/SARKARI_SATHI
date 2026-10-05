import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/", "/login", "/register", "/admin"]; // /admin checks its own password

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("ss_session")?.value);
  if (!hasSession && !PUBLIC.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"] };
