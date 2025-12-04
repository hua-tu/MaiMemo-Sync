import { MaiMemoService } from "@/lib/maimemo";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const cookie = request.headers.get("x-maimemo-cookie");

    if (!cookie) {
      return NextResponse.json(
        { error: "Cookie is required" },
        { status: 401 }
      );
    }

    const phrases = await MaiMemoService.getPhraseList(cookie, page);

    return NextResponse.json({ phrases });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch phrase list" },
      { status: 500 }
    );
  }
}
