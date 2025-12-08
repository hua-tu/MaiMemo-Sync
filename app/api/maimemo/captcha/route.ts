import { MaiMemoService } from "@/lib/maimemo";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const cookie = request.headers.get("x-maimemo-cookie");

    if (!cookie) {
      return NextResponse.json(
        { error: "Cookie is required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const returnCode = searchParams.get("time");

    const imageBuffer = await MaiMemoService.getCaptcha(cookie);

    // Recognize captcha only if requested
    let captchaCode = "";
    if (returnCode) {
      try {
        captchaCode = await MaiMemoService.recognizeCaptcha(imageBuffer);
      } catch (e) {
        console.error("Captcha recognition failed:", e);
      }
    }

    const headers = new Headers();
    headers.set("Content-Type", "image/jpeg");
    if (captchaCode) {
      headers.set("X-Captcha-Code", captchaCode);
    }

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: headers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch captcha" },
      { status: 500 }
    );
  }
}
