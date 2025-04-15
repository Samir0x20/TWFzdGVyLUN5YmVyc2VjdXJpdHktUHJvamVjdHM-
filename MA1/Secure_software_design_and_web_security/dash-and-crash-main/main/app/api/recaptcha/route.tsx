import { NextRequest, NextResponse } from "next/server";
import { verifyRecaptcha } from "./middleware";
import { log } from "./../../../log.js";
import { extractRequestDetails } from "../../utils/extractRequestDetails";
import { sanitize } from "../../utils/utils";

export async function POST(req: NextRequest) {
  const { header } = await extractRequestDetails(req);

  try {
    const token = req.headers.get('x-recaptcha-token');

    if (!token) {
      log("info", "reCAPTCHA token missing", { req: header });
      throw new Error("reCAPTCHA token missing");
    }

    const sanitizedtoken = sanitize(token);

    const data = await verifyRecaptcha(sanitizedtoken) as { success: boolean; score: number };

    if (!data.success) {
      log("info", "reCAPTCHA verification failed", { data: data, req: header });
      throw new Error("reCAPTCHA verification failed");
    }
  
    if (data.score < 0.5) {
      log("info", "Low reCAPTCHA score", { data: data, req: header });
      throw new Error("Low reCAPTCHA score");
    }

    log("info", "reCAPTCHA verification successful", { data: data, req: header });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    log("error", "Error verifying reCAPTCHA", { error: (error as Error).message, req: header });
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}