import { MaiMemoService } from "@/lib/maimemo";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const notepadId = searchParams.get("notepadId");
    const cookie = request.headers.get("x-maimemo-cookie");

    if (!notepadId) {
      return NextResponse.json(
        { error: "Notepad ID is required" },
        { status: 400 }
      );
    }

    if (!cookie) {
      return NextResponse.json(
        { error: "Cookie is required" },
        { status: 401 }
      );
    }

    const detail = await MaiMemoService.getNotepadDetail(cookie, notepadId);

    return NextResponse.json(detail);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch notepad details" },
      { status: 500 }
    );
  }
}
