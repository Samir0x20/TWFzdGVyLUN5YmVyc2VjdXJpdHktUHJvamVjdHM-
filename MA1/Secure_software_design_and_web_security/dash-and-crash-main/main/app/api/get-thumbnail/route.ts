import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/app/utils/withAuth';
import { log } from '@/log';
import { extractRequestDetails } from "../../utils/extractRequestDetails";
import { sanitize } from "../../utils/utils";

async function handleGet(req: NextRequest) {
  const session = (req as any).session;
  const ownerId = session.user.id;
  const { header } = await extractRequestDetails(req);
  

  try {
    const videoCode = req.nextUrl.searchParams.get("videoCode");

    if (!videoCode) {
      log('error', 'Missing videoCode in request query', { ownerId, req: header });
      return NextResponse.json({ error: "Missing videoCode" }, { status: 400 });
    }

    const sanitizedvideoCode = sanitize(videoCode);

    // Define the path to the thumbnail
    const thumbPath = path.join(process.cwd(), "uploads", sanitizedvideoCode, "thumb.jpg");

    // Check if the thumbnail exists
    if (!fs.existsSync(thumbPath)) {
      log('error', 'Thumbnail not found', { ownerId, sanitizedvideoCode, req: header });
      return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 });
    }

    // Read the thumbnail file
    const thumbnail = fs.readFileSync(thumbPath);

    log('info', 'Thumbnail fetched', { ownerId, sanitizedvideoCode, req: header });
    console.log(`[DEBUG] Thumbnail fetched for video ${sanitizedvideoCode}`);

    // Return the thumbnail as an image response
    return new NextResponse(thumbnail, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
      },
    });
  } catch (error) {
    log('error', 'Error fetching thumbnail', { ownerId, error: (error as Error).message, req: header });
    console.error("[DEBUG] Error fetching thumbnail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(handleGet);