import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { log } from "../../log.js";

export function withAuth(handler: Function) {
  return async (req: any) => {
    const excludedPaths = [
      '/auth/signin', 
      '/auth/role', 
      '/auth/trustedsignin', 
      '/auth/trustedlogin',
    ];
    const trustedExcludedPaths = [
      '/api/share-video', 
      '/api/upload', 
      '/api/upload-thumbnail', 
      '/api/videos',
      '/api/setpassword'
    ]


    // Check if the request path is in the excluded paths
    if (excludedPaths.includes(req.nextUrl.pathname)) {
      return handler(req);
    }

    try {
      const session = await auth();

      if (!session) {
        log("info", "Unauthorized access attempt", { session: session });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Add session to the request object if needed
      req.session = session;

      const role = session.role;
      const email = session.email;
      const emailVerified = session.emailVerified;
      const redirectToFirstSignin = session.redirectToFirstSignin;
      const isTwoFactorEnabled = session.isTwoFactorEnabled;
      const isSession2FA = session.isSession2FA;
      
      // Check if the user has 2FA enabled
      if(!isTwoFactorEnabled) {
        log("info", "User 2FA is not enabled", { email: email, role: role });
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Check if the user session 2FA is enabled
      if(!isSession2FA) {
        log("info", "User session 2FA is not enabled", { email: email, role: role });
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Check if the user email is verified
      if (!emailVerified && !excludedPaths.includes(req.nextUrl.pathname)) {
        log("info", "User email is not verified", { email: email, role: role });
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Check if the user needs to be redirected to the first sign-in page
      if (redirectToFirstSignin && !excludedPaths.includes(req.nextUrl.pathname)) {
        log("info", "Redirecting user to first sign-in page", { email: email, role: role });
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Check if the user is trusted and the path is excluded
      if(role === "trusted" && trustedExcludedPaths.includes(req.nextUrl.pathname)) {
        log("info", "Unauthorized action attempt", { email: email, role: role });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Proceed to the original handler
      return handler(req);
    } catch (error) {
      log("error", "Error during API authentication", { error: (error as Error).message });
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}