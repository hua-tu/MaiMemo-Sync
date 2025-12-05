"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NotepadSyncProps {
  cookie: string;
}

export function NotepadSync({ cookie }: NotepadSyncProps) {
  const [notepadId, setNotepadId] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [newContent, setNewContent] = useState("");
  const [mergedContent, setMergedContent] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (cookie && notepadId) {
      // Optional: Auto-fetch logic could go here
    }
  }, [cookie, notepadId]);

  useEffect(() => {
    if (detail) {
      const existing = detail.contentList || [];
      const newWords = newContent
        .split("\n")
        .map((w) => w.trim())
        .filter((w) => w);

      // Case-insensitive deduplication
      const existingLower = new Set(
        existing.map((w: string) => w.toLowerCase())
      );
      const merged = [...existing];

      newWords.forEach((word) => {
        if (!existingLower.has(word.toLowerCase())) {
          merged.push(word);
          existingLower.add(word.toLowerCase());
        }
      });

      setMergedContent(merged);
    }
  }, [detail, newContent]);

  const filteredContent = mergedContent.filter((word) =>
    word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFetch = async () => {
    if (!notepadId) {
      setError("Please enter a Notepad ID");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/maimemo/notepad?notepadId=${notepadId}`, {
        headers: { "x-maimemo-cookie": cookie! },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetail(data);
      setNewContent("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportPhrases = async () => {
    setImporting(true);
    setError("");
    try {
      const res = await fetch("/api/maimemo/phrase/all", {
        headers: { "x-maimemo-cookie": cookie! },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const words = data.words || [];
      const currentNewWords = newContent
        .split("\n")
        .map((w) => w.trim())
        .filter((w) => w);

      // Append only unique words (case-insensitive check against current new words)
      // Note: The useEffect will handle deduplication against *existing* words.
      // Here we just want to avoid duplicates within the new content itself if possible,
      // or just append and let the user see them.
      // But better to append.

      const newWordsSet = new Set(currentNewWords.map((w) => w.toLowerCase()));
      const wordsToAdd: string[] = [];

      words.forEach((w: string) => {
        if (!newWordsSet.has(w.toLowerCase())) {
          wordsToAdd.push(w);
          newWordsSet.add(w.toLowerCase());
        }
      });

      if (wordsToAdd.length > 0) {
        setNewContent((prev) => {
          const prefix = prev ? prev + "\n" : "";
          return prefix + wordsToAdd.join("\n");
        });
        setSuccess(`Imported ${wordsToAdd.length} words from phrases.`);
      } else {
        setSuccess("No new words to import.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/maimemo/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-maimemo-cookie": cookie!,
        },
        body: JSON.stringify({
          notepadId: detail.notepadId,
          newWords: newContent
            .split("\n")
            .map((w) => w.trim())
            .filter((w) => w),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Saved successfully! Added ${data.addedCount} words.`);
      // Refresh detail
      handleFetch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!cookie) return <div>Please login first.</div>;

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Notepad ID
          </label>
          <Input
            value={notepadId}
            onChange={(e) => setNotepadId(e.target.value)}
            placeholder="e.g. 12345"
          />
        </div>
        <Button onClick={handleFetch} disabled={loading}>
          {loading ? "Loading..." : "Fetch Detail"}
        </Button>
      </div>

      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">{success}</div>}

      {detail && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-bold">{detail.title}</h3>
            <p className="text-sm text-gray-500">{detail.brief}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-700">
                  New Words (One per line)
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportPhrases}
                  disabled={importing}
                >
                  {importing ? "Importing..." : "Import Phrases"}
                </Button>
              </div>
              <textarea
                className="w-full h-96 p-3 border rounded-md font-mono text-sm"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter new words here..."
              />
            </div>
            <div className="flex flex-col h-96">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Final Result Preview ({mergedContent.length} words)
              </label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search words..."
                className="mb-2"
              />
              <div className="flex-1 p-3 border rounded-md bg-gray-50 overflow-y-auto font-mono text-sm break-words">
                {filteredContent.length > 0 ? (
                  filteredContent.join(", ")
                ) : (
                  <span className="text-gray-400">No words found</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Syncing..." : "Sync to Cloud"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
