import { MaiMemoService } from "@/lib/maimemo";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const spelling = searchParams.get("spelling");
    const cookie = request.headers.get("x-maimemo-cookie");

    if (!cookie) {
      return NextResponse.json(
        { error: "Cookie is required" },
        { status: 401 }
      );
    }

    if (!spelling) {
      return NextResponse.json(
        { error: "Spelling is required" },
        { status: 400 }
      );
    }

    const result = await MaiMemoService.searchVocabulary(cookie, spelling);

    if (!result) {
      return NextResponse.json(
        { error: "Vocabulary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to search vocabulary" },
      { status: 500 }
    );
  }
}
