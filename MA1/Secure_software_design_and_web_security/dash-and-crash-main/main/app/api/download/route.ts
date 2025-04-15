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

   
  const sanitizedownerId = sanitize(ownerId);

  try {
    const videoCode = req.nextUrl.searchParams.get("videoCode");
    const chunkIndex = req.nextUrl.searchParams.get("chunkIndex");

    if (!videoCode || !chunkIndex) {
      log('error', 'Missing videoCode or chunkIndex in request query', { sanitizedownerId, req: header });
      return new Response(JSON.stringify({ error: "Missing videoCode or chunkIndex" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sanitizedvideoCode = sanitize(videoCode);
    const sanitizedchunkIndex = sanitize(chunkIndex);

    const filePath = path.join(process.cwd(), "uploads", sanitizedvideoCode, `chunk_${sanitizedchunkIndex}.data`);
    if (!fs.existsSync(filePath)) {
      log('error', 'File not found', { sanitizedownerId, videoCode, sanitizedchunkIndex, req: header });
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fileStream = fs.createReadStream(filePath);
    log('info', 'File retrieved', { sanitizedownerId, sanitizedvideoCode, sanitizedchunkIndex, req: header });
    console.log(`[DEBUG] File retrieved for video ${sanitizedvideoCode}, chunk ${sanitizedchunkIndex}`);
    return new Response(fileStream as any, {
      status: 200,
      headers: {
        "Content-Type": "video/webm",
        "Content-Disposition": `inline; filename="chunk_${sanitizedchunkIndex}.webm"`,
      },
    });
  } catch (error) {
    log('error', 'Error retrieving file', { sanitizedownerId, error: (error as any).message, req: header });
    console.error("[DEBUG] Error retrieving file:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const GET = withAuth(handleGet);