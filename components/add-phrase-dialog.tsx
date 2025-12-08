"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddPhraseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cookie: string;
}

export function AddPhraseDialog({
  isOpen,
  onClose,
  onSuccess,
  cookie,
}: AddPhraseDialogProps) {
  const [voc, setVoc] = useState("");
  const [vocId, setVocId] = useState("");
  const [phrase, setPhrase] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [origin, setOrigin] = useState("");
  const [publish, setPublish] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaUrl, setCaptchaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isgetCaptcha = true;
  useEffect(() => {
    if (isOpen) {
      fetchCaptcha();
    } else {
      // Reset state when closed
      setVoc("");
      setVocId("");
      setPhrase("");
      setInterpretation("");
      setOrigin("");
      setPublish(false);
      setCaptcha("");
      setError("");
      // Cleanup blob url
      if (captchaUrl) {
        URL.revokeObjectURL(captchaUrl);
      }
      setCaptchaUrl(null);
    }
  }, [isOpen]);

  const fetchCaptcha = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        isgetCaptcha
          ? `/api/maimemo/captcha?time=${Date.now()}`
          : "/api/maimemo/captcha",
        {
          headers: { "x-maimemo-cookie": cookie },
        }
      );
      if (!res.ok) throw new Error("Failed to load captcha");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setCaptchaUrl(url);

      if (isgetCaptcha) {
        const code = res.headers.get("x-captcha-code");
        if (code) {
          setCaptcha(code);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!vocId || !phrase || !interpretation || !captcha) {
      setError("请填写所有必填项，并确保单词已匹配");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/maimemo/phrase/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-maimemo-cookie": cookie,
        },
        body: JSON.stringify({
          voc: vocId,
          phrase,
          interpretation,
          origin,
          publish,
          captcha,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      // Refresh captcha on error
      fetchCaptcha();
      setCaptcha("");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-10">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-8 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-2xl font-bold text-gray-800">新建例句</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              单词
            </label>
            <div className="relative">
              <Input
                value={voc}
                onChange={(e) => {
                  setVoc(e.target.value);
                  setVocId(""); // Reset ID on change
                }}
                onBlur={async () => {
                  if (voc) {
                    try {
                      const res = await fetch(
                        `/api/maimemo/vocabulary/search?spelling=${voc}`,
                        {
                          headers: { "x-maimemo-cookie": cookie },
                        }
                      );
                      const data = await res.json();
                      if (res.ok && data.voc_id) {
                        setVocId(data.voc_id.toString());
                        setError(""); // Clear error if word found
                      } else {
                        setVocId("");
                        setError("未找到该单词");
                      }
                    } catch (err) {
                      setVocId("");
                      setError("搜索单词失败");
                    }
                  } else {
                    setVocId("");
                    setError("");
                  }
                }}
                placeholder="请输入单词 (例如: well)"
                className={`w-full ${vocId ? "border-green-500" : ""}`}
              />
              {vocId && (
                <span className="absolute right-3 top-2 text-green-500 text-sm">
                  ✓ 已匹配
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              例句标签{" "}
              <span className="text-gray-400 font-normal">至多选择3个标签</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "小学",
                "初中",
                "高中",
                "四级",
                "六级",
                "考研",
                "雅思",
                "托福",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm cursor-not-allowed opacity-60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              例句英文{" "}
              <span className="text-gray-400 font-normal">最少3个字符</span>
            </label>
            <textarea
              className="w-full p-3 border rounded-md min-h-[80px] focus:outline-none focus:ring-2 focus:ring-green-500"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              例句中文{" "}
              <span className="text-gray-400 font-normal">最少1个字符</span>
            </label>
            <textarea
              className="w-full p-3 border rounded-md min-h-[80px] focus:outline-none focus:ring-2 focus:ring-green-500"
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              例句来源{" "}
              <span className="text-gray-400 font-normal">最少0个字符</span>
            </label>
            <Input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              公开例句{" "}
              <span className="text-gray-400 font-normal">
                / 是否公开此例句
              </span>
            </label>
            <div className="flex space-x-2">
              <button
                className={`px-4 py-1 rounded ${
                  !publish ? "bg-gray-200 text-gray-700" : "bg-white border"
                }`}
                onClick={() => setPublish(false)}
              >
                私有
              </button>
              <button
                className={`px-4 py-1 rounded ${
                  publish ? "bg-green-500 text-white" : "bg-white border"
                }`}
                onClick={() => setPublish(true)}
              >
                公开
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              验证码
            </label>
            <div className="flex items-center space-x-4">
              <Input
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                className="w-32"
              />
              <div
                className="cursor-pointer border rounded overflow-hidden"
                onClick={fetchCaptcha}
                title="点击刷新"
                style={{ width: "120px", height: "36px" }}
              >
                {loading ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                    Loading...
                  </div>
                ) : captchaUrl ? (
                  <img
                    src={captchaUrl}
                    alt="Captcha"
                    style={{
                      width: "120px",
                      height: "36px",
                      objectFit: "fill",
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-red-400">
                    Error
                  </div>
                )}
              </div>
              <span
                className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={fetchCaptcha}
              >
                ⟳ 刷新
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
            className="w-24"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="w-24 bg-green-500 hover:bg-green-600 text-white"
          >
            {submitting ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
