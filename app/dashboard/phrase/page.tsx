"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AddPhraseDialog } from "@/components/add-phrase-dialog";

interface Phrase {
  id: string;
  word: string;
  sentence: string;
  translation: string;
}

export default function PhrasePage() {
  const [cookie, setCookie] = useState<string | null>(null);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const storedCookie = localStorage.getItem("maimemo_cookie");
    setCookie(storedCookie);
  }, []);

  useEffect(() => {
    if (cookie) {
      fetchPhrases();
    }
  }, [cookie, page]);

  const fetchPhrases = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/maimemo/phrase?page=${page}`, {
        headers: { "x-maimemo-cookie": cookie! },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhrases(data.phrases);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!cookie) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Phrases</h2>
        <Button onClick={() => setIsDialogOpen(true)}>Add Phrase</Button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Word
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sentence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Translation
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : phrases.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  No phrases found.
                </td>
              </tr>
            ) : (
              phrases.map((phrase, idx) => (
                <tr key={phrase.id || idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {phrase.word}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {phrase.sentence}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {phrase.translation}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </Button>
        <span className="flex items-center text-sm text-gray-600">
          Page {page}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={loading || phrases.length < 30}
        >
          Next
        </Button>
      </div>

      <AddPhraseDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => {
          fetchPhrases();
        }}
        cookie={cookie}
      />
    </div>
  );
}
