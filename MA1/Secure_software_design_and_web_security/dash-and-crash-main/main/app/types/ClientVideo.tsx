import { Video } from "@prisma/client";

// This is a wrapper because credentials are stored on CLIENT -.-
// ClientVideo is a Video with its credentials (localstorage)
export interface ClientVideo {
    code: string;
    dateStarted: Date;
    chunkCount: number | undefined;
    encryptedAesKey: ArrayBuffer;
    iv: Uint8Array;
  }
  