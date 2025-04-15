import { NextRequest } from "next/server";

export async function extractRequestDetails(req: NextRequest) {
    const header: { [key: string]: string } = {};
  
    // Iterate over headers and store them in an object
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'cookie' && key.toLowerCase() !== 'session') {
        header[key] = value;
      }
    });
    
    return { header };
  }