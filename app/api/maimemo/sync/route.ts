import { MaiMemoService } from "@/lib/maimemo";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { notepadId, newWords } = await request.json();
    const cookie = request.headers.get("x-maimemo-cookie");

    if (!notepadId || !newWords || !Array.isArray(newWords)) {
      return NextResponse.json(
        { error: "Notepad ID and new words list are required" },
        { status: 400 }
      );
    }

    if (!cookie) {
      return NextResponse.json(
        { error: "Cookie is required" },
        { status: 401 }
      );
    }

    // 1. Get current details
    const currentDetail = await MaiMemoService.getNotepadDetail(
      cookie,
      notepadId
    );

    // 2. Merge words (deduplicate)
    const existingWords = new Set(currentDetail.contentList);
    const wordsToAdd = newWords.filter((w) => !existingWords.has(w));

    if (wordsToAdd.length === 0) {
      return NextResponse.json({
        message: "No new words to sync",
        addedCount: 0,
      });
    }

    const mergedContent = [...currentDetail.contentList, ...wordsToAdd];

    // 3. Save back
    await MaiMemoService.saveNotepad(cookie, currentDetail, mergedContent);

    return NextResponse.json({
      message: "Sync successful",
      addedCount: wordsToAdd.length,
      addedWords: wordsToAdd,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Sync failed" },
      { status: 500 }
    );
  }
}
