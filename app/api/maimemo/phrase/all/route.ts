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

    const words = await MaiMemoService.getAllPhraseWords(cookie);

    return NextResponse.json({ words });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch all phrases" },
      { status: 500 }
    );
  }
}
