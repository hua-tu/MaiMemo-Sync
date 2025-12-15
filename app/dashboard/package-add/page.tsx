"use client";

import { useEffect, useState, ChangeEvent } from "react";
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
  Save,
  Clipboard,
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

type PhraseSnapshot = Pick<
  PhraseRow,
  "voc" | "phrase" | "interpretation" | "origin" | "publish"
>;

interface SavedLog {
  id: string;
  createdAt: string;
  rows: PhraseSnapshot[];
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
  const [logs, setLogs] = useState<SavedLog[]>([]);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState("");

  useEffect(() => {
    const storedCookie = localStorage.getItem("maimemo_cookie");
    setCookie(storedCookie);
  }, []);

  useEffect(() => {
    const storedLogs = localStorage.getItem("maimemo_phrase_logs");
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch {
        // ignore corrupted logs
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("maimemo_phrase_logs", JSON.stringify(logs));
  }, [logs]);

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

  const handleSaveLog = () => {
    const snapshot: PhraseSnapshot[] = rows
      .filter((row) => row.voc && row.phrase && row.interpretation)
      .map((row) => ({
        voc: row.voc,
        phrase: row.phrase,
        interpretation: row.interpretation,
        origin: row.origin,
        publish: row.publish,
      }));

    if (snapshot.length === 0) {
      alert("没有可保存的例句（请填写必要字段）");
      return;
    }

    const newLog: SavedLog = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      rows: snapshot,
    };

    setLogs((prev) => [newLog, ...prev]);
    alert("已保存当前例句列表到日志");
  };

  const handleCopyLog = async (logId: string) => {
    const log = logs.find((l) => l.id === logId);
    if (!log) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(log.rows, null, 2));
      alert("日志已复制为 JSON");
    } catch {
      alert("复制失败，请手动选择文本复制");
    }
  };

  const handleLoadLog = (log: SavedLog) => {
    const mappedRows: PhraseRow[] = log.rows.map((r) => ({
      id: crypto.randomUUID(),
      voc: r.voc,
      phrase: r.phrase,
      interpretation: r.interpretation,
      origin: r.origin,
      publish: r.publish,
      status: "idle",
    }));
    setRows(mappedRows.length ? mappedRows : rows);
    setIsLogDialogOpen(false);
  };

  const handleImportJson = () => {
    if (!importJson.trim()) {
      alert("请先粘贴 JSON 数据");
      return;
    }
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) {
        throw new Error("JSON 须为数组");
      }
      const mappedRows: PhraseRow[] = parsed.map((item: any) => ({
        id: crypto.randomUUID(),
        voc: item.voc || "",
        phrase: item.phrase || "",
        interpretation: item.interpretation || "",
        origin: item.origin || "",
        publish: Boolean(item.publish),
        status: "idle",
      }));

      if (mappedRows.length === 0) {
        alert("导入内容为空");
        return;
      }

      setRows(mappedRows);
      setImportJson("");
      setIsLogDialogOpen(false);
      alert("已通过 JSON 导入例句列表");
    } catch (err: any) {
      alert("导入失败: " + err.message);
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
          <Button variant="outline" onClick={handleSaveLog}>
            <Save className="mr-2 h-4 w-4" />
            保存日志
          </Button>
          <Button variant="outline" onClick={() => setIsLogDialogOpen(true)}>
            <Clipboard className="mr-2 h-4 w-4" />
            查看日志
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

      {isLogDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div>
                <div className="text-xl font-semibold">保存的日志</div>
                <div className="text-sm text-muted-foreground">
                  每条日志保存一次例句列表，可复制 JSON 或直接导入。
                </div>
              </div>
              <Button variant="ghost" onClick={() => setIsLogDialogOpen(false)}>
                关闭
              </Button>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  暂无日志，先点击“保存日志”创建。
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">
                        保存时间：{new Date(log.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        条目数：{log.rows.length}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLog(log.id)}
                      >
                        复制 JSON
                      </Button>
                      <Button size="sm" onClick={() => handleLoadLog(log)}>
                        导入到列表
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">通过 JSON 导入</div>
              <textarea
                value={importJson}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setImportJson(e.target.value)
                }
                placeholder='粘贴例句数组，如: [{"voc":"apple","phrase":"I ate an apple.","interpretation":"我吃了一个苹果。"}]'
                rows={6}
                className="w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleImportJson}>
                  导入
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
