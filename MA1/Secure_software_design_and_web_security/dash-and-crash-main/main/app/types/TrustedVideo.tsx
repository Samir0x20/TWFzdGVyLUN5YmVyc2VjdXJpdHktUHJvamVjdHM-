import { Video } from "@prisma/client";

// This is a wrapper because credentials are stored on CLIENT -.-
// ClientVideo is a Video with its credentials (localstorage)
export interface TrustedVideo {
    code: string;
    chunkCount: number
    encryptedAesKey: string;
    encryptedPrivateKeyEnc: string;
  }