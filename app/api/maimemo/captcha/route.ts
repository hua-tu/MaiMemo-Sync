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

    const imageBuffer = await MaiMemoService.getCaptcha(cookie);

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png", // Assuming PNG, but browser will detect
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch captcha" },
      { status: 500 }
    );
  }
}
