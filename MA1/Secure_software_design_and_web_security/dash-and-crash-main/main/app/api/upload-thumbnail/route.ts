import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from "@/app/utils/withAuth";
import { log } from "@/log";
import { extractRequestDetails } from "../../utils/extractRequestDetails";
import { auth } from "@/auth";
import { sanitize } from "../../utils/utils";

const prisma = new PrismaClient();

async function handlePost(req: NextRequest) {
  let session: any;
  let header: any;

  try {
    // Authenticate user and extract request details
    session = await auth();
    ({ header } = await extractRequestDetails(req));
     
    

    // Ensure user is authenticated
    if (!session?.user) {
      log("error", "Unauthorized", { req: header });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerId = session.user.id;
    if (!ownerId) {
      log("error", "Unauthorized, user ID not found", { req: header });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract videoCode from query parameters
    const videoCode = req.nextUrl.searchParams.get("videoCode");
    if (!videoCode) {
      log("error", "Missing videoCode in request query", {
        ownerId,
        req: header,
      });
      return NextResponse.json({ error: "Missing videoCode" }, { status: 400 });
    }

    const sanitizedvideoCode = sanitize(videoCode);

    // Ensure the video exists and belongs to the authenticated user
    const video = await prisma.video.findFirst({
      where: { code: sanitizedvideoCode, ownerId: ownerId },
    });
    if (!video) {
      log("error", "Video not found", { ownerId, sanitizedvideoCode, req: header });
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Ensure the upload directory for this video exists
    const videoDir = path.join(process.cwd(), "uploads", sanitizedvideoCode);
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    // Extract the thumbnail file from form data
    const formData = await req.formData();
    const thumbnail = formData.get("thumbnail") as File;

    if (!thumbnail) {
      log("error", "Missing thumbnail file in request body", {
        ownerId,
        req: header,
      });
      return NextResponse.json(
        { error: "Missing thumbnail file" },
        { status: 400 }
      );
    }

    // Save the thumbnail as `thumb.jpg` in the video directory
    const thumbPath = path.join(videoDir, "thumb.jpg");
    const buffer = Buffer.from(await thumbnail.arrayBuffer());
    fs.writeFileSync(thumbPath, buffer);

    log("info", "Thumbnail uploaded", { ownerId, sanitizedvideoCode, req: header });
    console.log(`[DEBUG] Thumbnail uploaded for video ${sanitizedvideoCode}`);
    return NextResponse.json({ message: "Thumbnail uploaded successfully" });
  } catch (error) {
    log("error", "Error uploading thumbnail", {
      session,
      error: (error as Error).message,
      req: header,
    });
    console.error("[DEBUG] Error uploading thumbnail:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePost);
