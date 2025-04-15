import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { withAuth } from "@/app/utils/withAuth";
import { log } from "@/log";
import { extractRequestDetails } from "../../utils/extractRequestDetails";
import { sanitize } from "../../utils/utils";

const prisma = new PrismaClient();

const handleGet = async (req: NextRequest) => {
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

    const videos = await prisma.video.findMany({
      where: {
        ownerId: ownerId,
      },
      include: {
        videoAccessKey: {
          where: {
            recipientId: ownerId,
          },
        },
      },
    });

    // Enrich videos with the actual chunkCount from the filesystem
    const enrichedVideos = videos.map((video) => {
      const newVideo = {
        code: video.code,
        dateStarted: video.dateStarted,
        encryptedKey: video.videoAccessKey[0].key,
      };

      const videoDir = path.join(process.cwd(), "uploads", video.code);

      if (fs.existsSync(videoDir)) {
        const files = fs.readdirSync(videoDir);
        const chunkCount = files.filter(
          (file) => file.startsWith("chunk_") && file.endsWith(".webm")
        ).length;
        return { ...newVideo, chunkCount };
      }

      return { ...newVideo, chunkCount: 0 };
    });

    log("info", "Fetched videos", {
      ownerId,
      videoCount: videos.length,
      req: header,
    });

    return NextResponse.json({ videos: enrichedVideos });
  } catch (error) {
    log("error", "Error fetching videos", {
      session,
      error: (error as Error).message,
      req: header,
    });
    console.error("[DEBUG] Error fetching videos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

const handlePost = async (req: NextRequest) => {
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

    const uniqueCode = generateVideoCode();

    const videoKey = (await req.json()).videoKey;
    if (!videoKey) {
      log("error", "Missing videoKey in request body", {
        ownerId,
        req: header,
      });
      return NextResponse.json({ error: "Missing videoKey" }, { status: 400 });
    }

    const sanitizedVideoKey = sanitize(videoKey);

    const video = await prisma.video.create({
      data: {
        ownerId,
        dateStarted: new Date(),
        code: uniqueCode,
        chunkCount: 0,
      },
    });

    // Add the session key for the owner
    await prisma.videoAccessKey.create({
      data: {
        videoId: video.id,
        recipientId: ownerId,
        key: sanitizedVideoKey,
      },
    });

    log("info", "Created video", { ownerId, videoId: video.id, req: header });

    // Return a response compatible with ClientVideo
    return NextResponse.json({
      video: {
        ...video,
        aesKey: videoKey,
      },
    });
  } catch (error) {
    // TODO: No value exists in scope for the shorthand property 'ownerId'. Either declare one or provide an initializer.ts(18004) (property) ownerId: any
    /*  log("error", "Error creating video", {
      ownerId,
      error: (error as Error).message,
      req: header,
    }); */

    log("error", "Error creating video", {
      error: (error as Error).message,
      req: header,
    });
    console.error("[DEBUG] Error creating video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

const handleDelete = async (req: NextRequest) => {
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
    if (!videoCode) {
      log("error", "Missing videoCode in query params", {
        ownerId,
        req: header,
      });
      return NextResponse.json({ error: "Missing videoCode" }, { status: 400 });
    }

    const sanitizedVideoCode = sanitize(videoCode);

    const video = await prisma.video.findFirst({ where: { code: sanitizedVideoCode } });
    if (!video) {
      log("error", "Video not found", { ownerId, videoCode, req: header });
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const videoDir = path.join(process.cwd(), "uploads", sanitizedVideoCode);
    if (fs.existsSync(videoDir)) {
      fs.rmSync(videoDir, { recursive: true, force: true });
      console.log(`[DEBUG] Deleted all chunks for video ${sanitizedVideoCode}`);
    }

    await prisma.video.delete({ where: { id: video.id } });
    console.log(`[DEBUG] Deleted video from database: ${sanitizedVideoCode}`);

    log("info", "Deleted video", { ownerId, videoId: video.id, req: header });

    return NextResponse.json({ message: "Video deleted successfully" });
  } catch (error) {
    log("error", "Error deleting video", {
      session,
      error: (error as Error).message,
      req: header,
    });
    console.error("[DEBUG] Error deleting video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

function generateVideoCode(): string {
  return [...Array(10)].map(() => Math.random().toString(36)[2]).join("");
}

// Wrap handlers with withAuth
export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
export const DELETE = withAuth(handleDelete);
