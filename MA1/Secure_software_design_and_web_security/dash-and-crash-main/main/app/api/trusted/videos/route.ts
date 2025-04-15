import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/utils/withAuth";
import { log } from "../../../../log";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { extractRequestDetails } from "../../../utils/extractRequestDetails";
import { auth } from "@/auth";

const prisma = new PrismaClient();

const handleGET = async (req: NextRequest) => {
  let session: any;
  let header: any;
  let ownerId: string;

  try {
    session = await auth();
    ({ header } = await extractRequestDetails(req)); 
    
    ownerId = session.user.id;

    const videos = await prisma.videoAccessKey.findMany({
      where: {
        recipientId: ownerId,
      },
      include: {
        video: {
          include: {
            owner: true, // Include the owner (User) model
          },
        },
      },
    });

    // Enrich videos with the actual chunkCount from the filesystem
    const enrichedVideos = videos.map((videoAccessKey) => {
      const video = videoAccessKey.video;
      const newVideo = {
        id: video.id,
        code: video.code,
        dateStarted: video.dateStarted,
        accessKey: videoAccessKey.key,
        sharedByEmail: video.owner.email,
        encryptedPrivateKeyEnc: session.user.encryptedPrivateKeyEnc,
      };

      const videoDir = path.join(process.cwd(), "uploads", video.code);

      if (fs.existsSync(videoDir)) {
        const files = fs.readdirSync(videoDir);
        const chunkCount = files.filter(
          (file) => file.startsWith("chunk_") && file.endsWith(".data")
        ).length;
        return { ...newVideo, chunkCount };
      }

      return { ...newVideo, chunkCount: 0 };
    });

    log("info", "Fetched videos", { ownerId, videoCount: videos.length, req: header });
    return NextResponse.json({ videos: enrichedVideos });
  } catch (error) {
    log("error", "Error fetching videos", { error: (error as Error).message, req: header });
    console.error("[DEBUG] Error fetching videos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};


// Wrap handlers with withAuth
export const GET = withAuth(handleGET);
