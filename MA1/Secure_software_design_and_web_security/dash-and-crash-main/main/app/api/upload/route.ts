import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/app/utils/withAuth';
import { log } from '@/log';
import { extractRequestDetails } from "../../utils/extractRequestDetails";
import { auth } from "@/auth";
import { sanitize } from "../../utils/utils";

const prisma = new PrismaClient();

async function handlePost(req: NextRequest) {
  let session: any;
  let header: any;

  try {
    session = await auth();
    ({ header } = await extractRequestDetails(req));
     
    if (!session?.user) {
      log("error", "Unauthorized", { req: header });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerId = session.user.id;
    if (!ownerId) {
      log("error", "Unauthorized, user ID not found", { req: header });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const videoCode = req.nextUrl.searchParams.get("videoCode");
    const chunkIndex = req.nextUrl.searchParams.get("chunkIndex");

    if (!videoCode || !chunkIndex) {
      log('error', 'Missing videoCode or chunkIndex in request query', { ownerId, req: header });
      return NextResponse.json({ error: "Missing videoCode or chunkIndex" }, { status: 400 });
    }

    const sanitizedvideoCode = sanitize(videoCode);
    const sanitizedchunkIndex = sanitize(chunkIndex);

    // Find the video by code
    const video = await prisma.video.findFirst({ where: { code: sanitizedvideoCode, ownerId: ownerId } });
    if (!video) {
      log('error', 'Video not found', { ownerId, sanitizedvideoCode, req: header });
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Ensure the upload directory exists
    const videoDir = path.join(process.cwd(), "uploads", sanitizedvideoCode);
    if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

    // Save the chunk to disk
    const body = await req.arrayBuffer();
    const filePath = path.join(videoDir, `chunk_${sanitizedchunkIndex}.data`);
    fs.writeFileSync(filePath, Buffer.from(body));

    log('info', 'Chunk uploaded', { ownerId, sanitizedvideoCode, sanitizedchunkIndex, req: header });
    console.log(`[DEBUG] Chunk uploaded for video ${sanitizedvideoCode}, chunk ${sanitizedchunkIndex}`);
    return NextResponse.json({ message: "Chunk uploaded successfully" });
  } catch (error) {
    log('error', 'Error uploading chunk', { session, error: (error as Error).message, req: header });
    console.error('[DEBUG] Error uploading chunk:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withAuth(handlePost);