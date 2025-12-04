import { MaiMemoService } from "@/lib/maimemo";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { voc, phrase, interpretation, origin, publish, captcha } =
      await request.json();
    const cookie = request.headers.get("x-maimemo-cookie");

    if (!cookie) {
      return NextResponse.json(
        { error: "Cookie is required" },
        { status: 401 }
      );
    }

    if (!voc || !phrase || !interpretation || !captcha) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await MaiMemoService.savePhrase(cookie, {
      voc,
      phrase,
      interpretation,
      origin: origin || "",
      publish: !!publish,
      captcha,
    });

    return NextResponse.json({ message: "Phrase added successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add phrase" },
      { status: 500 }
    );
  }
}
