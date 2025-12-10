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

      // voc here is the spelling, e.g., "apple"
      if (!voc || !phrase || !interpretation) {
        results.push({
          voc,
          status: "failed",
          error: "Missing required fields (voc, phrase, interpretation)",
        });
        continue;
      }

      try {
        // 1. Search Vocabulary ID
        const searchResult = await MaiMemoService.searchVocabulary(cookie, voc);

        if (!searchResult || !searchResult.voc_id) {
          results.push({
            voc,
            status: "failed",
            error: "Word not found",
          });
          continue;
        }

        const vocId = searchResult.voc_id.toString();

        // 2. Get Captcha
        const captchaBuffer = await MaiMemoService.getCaptcha(cookie);

        // 3. Recognize Captcha
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

        // 4. Save Phrase
        await MaiMemoService.savePhrase(cookie, {
          voc: vocId,
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

      // Optional: Add a small delay
      // await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      message: "Package add operation completed",
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process package request" },
      { status: 500 }
    );
  }
}
