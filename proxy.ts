import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return new NextResponse("Admin access is not configured.", { status: 500 });
  }

  const auth = request.headers.get("authorization");

  if (auth?.startsWith("Basic ")) {
    // atob() throws on a malformed/non-base64 payload — a crafted or corrupted
    // header would otherwise crash the whole middleware invocation (a 500
    // with no controlled response) instead of just failing auth normally.
    try {
      const decoded = atob(auth.slice("Basic ".length));
      const password = decoded.slice(decoded.indexOf(":") + 1);
      if (password === adminPassword) {
        return NextResponse.next();
      }
    } catch {
      // Fall through to the 401 below.
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
