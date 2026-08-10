import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isProtectedRoute = createRouteMatcher(["/kanban(.*)", "/calendar(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  const authObj = await auth();
  const { userId, sessionClaims } = authObj;

  if (isAdminRoute(request)) {
    if (!userId) {
      return authObj.redirectToSignIn({ returnBackUrl: request.url });
    }
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;
    if (role && role !== "superuser") {
      const unauthorizedUrl = new URL("/unauthorized", request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  if (isProtectedRoute(request)) {
    if (!userId) {
      return authObj.redirectToSignIn({ returnBackUrl: request.url });
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
