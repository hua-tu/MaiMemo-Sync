"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trash2,
  Plus,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface PhraseRow {
  id: string;
  voc: string;
  phrase: string;
  interpretation: string;
  origin: string;
  publish: boolean;
  status: "idle" | "loading" | "success" | "error";
  error?: string;
}

export default function PackageAddPage() {
  const [cookie, setCookie] = useState<string | null>(null);
  const [rows, setRows] = useState<PhraseRow[]>([
    {
      id: "1",
      voc: "",
      phrase: "",
      interpretation: "",
      origin: "",
      publish: false,
      status: "idle",
    },
  ]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const storedCookie = localStorage.getItem("maimemo_cookie");
    setCookie(storedCookie);
  }, []);

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        voc: "",
        phrase: "",
        interpretation: "",
        origin: "",
        publish: false,
        status: "idle",
      },
    ]);
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof PhraseRow, value: any) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleUpload = async () => {
    if (!cookie) {
      alert("Please login first (Cookie not found)");
      return;
    }

    const validRows = rows.filter(
      (row) =>
        row.voc && row.phrase && row.interpretation && row.status !== "success"
    );

    if (validRows.length === 0) {
      alert("No valid rows to upload (or all already uploaded)");
      return;
    }

    setIsUploading(true);

    // Mark rows as loading
    setRows((prev) =>
      prev.map((row) =>
        validRows.find((r) => r.id === row.id)
          ? { ...row, status: "loading", error: undefined }
          : row
      )
    );

    try {
      const res = await fetch("/api/maimemo/phrase/package-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-maimemo-cookie": cookie,
        },
        body: JSON.stringify({
          phrases: validRows.map((r) => ({
            voc: r.voc,
            phrase: r.phrase,
            interpretation: r.interpretation,
            origin: r.origin,
            publish: r.publish,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Update rows based on results
      // The API returns results in the same order or with identifiers?
      // The API returns { results: [{ voc, status, error }] }
      // We need to match back to rows. Since voc might not be unique, this is tricky.
      // Ideally API should return the index or we map by order if preserved.
      // Let's assume order is preserved for now.

      const results = data.results;

      // We need to map results back to the validRows we sent
      const updatedRows = [...rows];

      validRows.forEach((row, index) => {
        const result = results[index];
        const rowIndex = updatedRows.findIndex((r) => r.id === row.id);

        if (rowIndex !== -1 && result) {
          updatedRows[rowIndex] = {
            ...updatedRows[rowIndex],
            status: result.status === "success" ? "success" : "error",
            error: result.error,
          };
        }
      });

      setRows(updatedRows);
    } catch (error: any) {
      alert("Batch upload failed: " + error.message);
      // Reset loading status for rows that were loading
      setRows((prev) =>
        prev.map((row) =>
          row.status === "loading"
            ? { ...row, status: "error", error: error.message }
            : row
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!cookie) {
    return (
      <div className="p-8 text-center">
        Please set your cookie in the main dashboard first.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Batch Add Phrases
          </h1>
          <p className="text-muted-foreground mt-2">
            Add multiple phrases at once. Enter the word spelling, and the
            system will automatically find the ID.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleAddRow}>
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload All
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phrases List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead className="w-[150px]">Word (Spelling)</TableHead>
                  <TableHead className="min-w-[300px]">
                    Phrase (English)
                  </TableHead>
                  <TableHead className="min-w-[300px]">
                    Interpretation (Chinese)
                  </TableHead>
                  <TableHead className="w-[150px]">Origin</TableHead>
                  <TableHead className="w-[80px] text-center">Public</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.status === "loading" && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                      {row.status === "success" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {row.status === "error" && (
                        <div className="group relative">
                          <XCircle className="h-4 w-4 text-red-500 cursor-help" />
                          <div className="absolute left-0 top-6 z-50 hidden group-hover:block w-48 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200 shadow-lg">
                            {row.error}
                          </div>
                        </div>
                      )}
                      {row.status === "idle" && (
                        <div className="h-4 w-4 rounded-full border border-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.voc}
                        onChange={(e) =>
                          handleUpdateRow(row.id, "voc", e.target.value)
                        }
                        placeholder="apple"
                        disabled={
                          row.status === "success" || row.status === "loading"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.phrase}
                        onChange={(e) =>
                          handleUpdateRow(row.id, "phrase", e.target.value)
                        }
                        placeholder="I ate an apple."
                        disabled={
                          row.status === "success" || row.status === "loading"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.interpretation}
                        onChange={(e) =>
                          handleUpdateRow(
                            row.id,
                            "interpretation",
                            e.target.value
                          )
                        }
                        placeholder="我吃了一个苹果。"
                        disabled={
                          row.status === "success" || row.status === "loading"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.origin}
                        onChange={(e) =>
                          handleUpdateRow(row.id, "origin", e.target.value)
                        }
                        placeholder="Daily Life"
                        disabled={
                          row.status === "success" || row.status === "loading"
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={row.publish}
                        onCheckedChange={(checked) =>
                          handleUpdateRow(row.id, "publish", checked)
                        }
                        disabled={
                          row.status === "success" || row.status === "loading"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRow(row.id)}
                        disabled={row.status === "loading"}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
