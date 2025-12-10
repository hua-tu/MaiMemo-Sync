import { MaiMemoService } from "@/lib/maimemo";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phrases } = body;
    const cookie = request.headers.get("x-maimemo-cookie");

    if (!cookie) {
      return NextResponse.json(
        { error: "Cookie is required" },
        { status: 401 }
      );
    }

    if (!Array.isArray(phrases) || phrases.length === 0) {
      return NextResponse.json(
        { error: "Phrases array is required and cannot be empty" },
        { status: 400 }
      );
    }

    const results = [];

    for (const phraseData of phrases) {
      const { voc, phrase, interpretation, origin, publish } = phraseData;

      if (!voc || !phrase || !interpretation) {
        results.push({
          voc,
          status: "failed",
          error: "Missing required fields (voc, phrase, interpretation)",
        });
        continue;
      }

      try {
        // 1. Get Captcha
        const captchaBuffer = await MaiMemoService.getCaptcha(cookie);

        // 2. Recognize Captcha
        const captchaCode = await MaiMemoService.recognizeCaptcha(
          captchaBuffer
        );

        if (!captchaCode) {
          results.push({
            voc,
            status: "failed",
            error: "Failed to recognize captcha",
          });
          continue;
        }

        // 3. Save Phrase
        await MaiMemoService.savePhrase(cookie, {
          voc,
          phrase,
          interpretation,
          origin: origin || "",
          publish: !!publish,
          captcha: captchaCode,
        });

        results.push({
          voc,
          status: "success",
        });
      } catch (error: any) {
        results.push({
          voc,
          status: "failed",
          error: error.message || "Unknown error",
        });
      }

      // Optional: Add a small delay to be nice to the server?
      // await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      message: "Batch operation completed",
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process batch request" },
      { status: 500 }
    );
  }
}
