import { extractRequestDetails } from "@/app/utils/extractRequestDetails";
import { withAuth } from "@/app/utils/withAuth";
import { auth } from "@/auth";
import { log } from "@/log";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { sanitize } from "../../utils/utils";

const prisma = new PrismaClient();

async function handlePost(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorize" }, { status: 401 });
  }
  const userId = session.user.id;
  const { header } = await extractRequestDetails(req);
   
  

  const { videoCode, recipientEmail, encryptedVideoKey } = await req.json();
  if (!videoCode || !recipientEmail || !encryptedVideoKey) {
    log('error', 'Missing required fields', { req: header });
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const sanitizedvideoCode = sanitize(videoCode);
  const sanitizedrecipientEmail = sanitize(recipientEmail);
  const sanitizedencryptedVideoKey = sanitize(encryptedVideoKey);

  try {
    // Get the video
    const video = await prisma.video.findFirst({
      where: {
        code: sanitizedvideoCode,
        ownerId: userId,
      },
    });
    if (!video) {
      log('error', 'Video not found', { fromUserId: userId, videoCode: sanitizedvideoCode, req: header });
      return NextResponse.json({ error: "Video not found" }, { status: 400 });
    }

    // Get the recipient
    const recipient = await prisma.user.findUnique({
      where: {
        email: sanitizedrecipientEmail,
        role: "trusted",
      },
      select: {
        id: true,
      },
    });
    if (!recipient) {
      log('error', 'Recipient not found', { fromUserId: userId, videoCode: sanitizedvideoCode, toUser: sanitizedrecipientEmail, req: header });
      return NextResponse.json({ error: "Recipient not found" }, { status: 400 });
    }

    // Share the video
    await prisma.videoAccessKey.create({
      data: {
        videoId: video.id,
        recipientId: recipient.id,
        key: sanitizedencryptedVideoKey,
      },
    });
    
    log('info', 'Shared video', { fromUserId: userId, videoCode: sanitizedvideoCode, toUser: sanitizedrecipientEmail, req: header });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    log('error', 'Error sharing video', { fromUserId: userId, videoCode: sanitizedvideoCode, toUser: sanitizedrecipientEmail, error: (error as Error).message, req: header });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withAuth(handlePost);