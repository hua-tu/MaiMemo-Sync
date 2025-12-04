"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NotepadSyncProps {
  cookie: string;
}

interface NotepadDetail {
  notepadId: string;
  title: string;
  contentList: string[];
}

export function NotepadSync({ cookie }: NotepadSyncProps) {
  const [notepadId, setNotepadId] = useState("");
  const [detail, setDetail] = useState<NotepadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState("");
  const [newWords, setNewWords] = useState("");
  const [syncResult, setSyncResult] = useState("");

  const fetchDetail = async () => {
    if (!notepadId) return;
    setLoading(true);
    setError("");
    setDetail(null);
    try {
      const res = await fetch(`/api/maimemo/notepad?notepadId=${notepadId}`, {
        headers: { "x-maimemo-cookie": cookie },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      console.log("hello", data);
      setDetail(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!detail) return;
    setSyncLoading(true);
    setSyncResult("");
    try {
      const words = newWords
        .split(/[\n,]+/)
        .map((w) => w.trim())
        .filter((w) => w);

      const res = await fetch("/api/maimemo/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-maimemo-cookie": cookie,
        },
        body: JSON.stringify({
          notepadId: detail.notepadId,
          newWords: words,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSyncResult(`Success! Added ${data.addedCount} new words.`);
      // Refresh detail
      fetchDetail();
      setNewWords("");
    } catch (err: any) {
      setSyncResult(`Error: ${err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4 max-w-md mx-auto mt-4">
      <h2 className="text-xl font-bold">Notepad Sync</h2>

      <div className="flex space-x-2">
        <Input
          placeholder="Notepad ID"
          value={notepadId}
          onChange={(e) => setNotepadId(e.target.value)}
        />
        <Button onClick={fetchDetail} disabled={loading}>
          {loading ? "Loading..." : "Load"}
        </Button>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {detail && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <div className="font-semibold">Title: {detail.title}</div>
            <div className="text-sm text-gray-500">
              Current Words: {detail.contentList.length}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Add New Words (one per line):
            </label>
            <textarea
              className="w-full p-2 border rounded-md min-h-[100px]"
              value={newWords}
              onChange={(e) => setNewWords(e.target.value)}
              placeholder="apple&#10;banana&#10;orange"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSync}
            disabled={syncLoading || !newWords.trim()}
          >
            {syncLoading ? "Syncing..." : "Sync to MaiMemo"}
          </Button>

          {syncResult && (
            <div
              className={`text-sm ${
                syncResult.startsWith("Error")
                  ? "text-red-500"
                  : "text-green-600"
              }`}
            >
              {syncResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
