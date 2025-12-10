"use client";

import { useEffect, useState, useCallback } from "react";

// --- 类型定义 ---
interface ClipboardItem {
  id: string; // 唯一标识
  content: string; // 文本内容
  timestamp: number; // 复制时间
  isExpanded?: boolean; // UI状态：是否展开
}

const STORAGE_KEY = "my-clipboard-history-v1";

export default function ClipboardHistoryPage() {
  // --- 状态管理 ---
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const [isMounted, setIsMounted] = useState(false); // 解决 Next.js Hydration 问题

  // --- 1. 初始化：组件挂载后读取 LocalStorage ---
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("读取缓存失败", e);
      }
    }
  }, []);

  // --- 2. 核心：保存到 LocalStorage ---
  // 每当 history 变化，自动同步到本地存储
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history, isMounted]);

  // --- 3. 核心：读取剪切板并去重添加 ---
  const readClipboard = useCallback(async () => {
    if (!navigator.clipboard) return;

    try {
      const text = await navigator.clipboard.readText();

      if (!text || text.trim() === "") return;

      setHistory((prev) => {
        // 查重：如果最新的一条和当前内容一样，就不重复添加
        if (prev.length > 0 && prev[0].content === text) {
          return prev;
        }

        const newItem: ClipboardItem = {
          id: crypto.randomUUID(), // 生成唯一ID
          content: text,
          timestamp: Date.now(),
          isExpanded: false, // 默认折叠
        };

        // 新内容插到最前面
        return [newItem, ...prev];
      });
    } catch (err) {
      console.error("读取失败（可能无权限或失焦）:", err);
    }
  }, []);

  // --- 4. 监听窗口聚焦事件 (实现“自动”读取) ---
  useEffect(() => {
    window.addEventListener("focus", readClipboard);
    return () => window.removeEventListener("focus", readClipboard);
  }, [readClipboard]);

  // --- CRUD 操作函数 ---

  // 删除一条
  const handleDelete = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // 清空所有
  const handleClearAll = () => {
    if (confirm("确定要清空所有历史记录吗？")) {
      setHistory([]);
    }
  };

  // 更新内容 (编辑)
  const handleUpdateContent = (id: string, newContent: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, content: newContent } : item
      )
    );
  };

  // 切换折叠状态
  const toggleExpand = (id: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };

  // 复制某条历史记录回剪切板
  const handleCopyBack = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已复制回剪切板！");
  };

  // 防止服务端渲染不一致
  if (!isMounted) return <div className="p-8">Loading history...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 min-h-screen bg-gray-50 text-gray-800">
      {/* 头部区域 */}
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-gray-50 py-4 z-10 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">剪切板时光机</h1>
          <p className="text-sm text-gray-500 mt-1">
            切换回此页面自动读取 | 共 {history.length} 条记录
          </p>
        </div>
        <div className="space-x-2">
          <button
            onClick={readClipboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            手动读取
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
          >
            清空历史
          </button>
        </div>
      </div>

      {/* 列表区域 */}
      <div className="space-y-4">
        {history.length === 0 && (
          <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-lg">
            暂无记录，请尝试在其他地方复制文字后，切换回此页面。
          </div>
        )}

        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* 卡片头部：时间 + 操作栏 */}
            <div
              className="flex items-center justify-between p-3 bg-gray-50 border-b cursor-pointer select-none"
              onClick={() => toggleExpand(item.id)}
            >
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {/* 展开/折叠 图标 */}
                <span className="text-gray-400 font-bold w-4">
                  {item.isExpanded ? "▼" : "▶"}
                </span>
                <span>{new Date(item.timestamp).toLocaleString()}</span>
              </div>

              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleCopyBack(item.content)}
                  className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-100 text-blue-600"
                >
                  复制
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-100 text-red-500"
                >
                  删除
                </button>
              </div>
            </div>

            {/* 卡片内容区 */}
            <div
              className={`p-4 ${
                item.isExpanded ? "" : "max-h-24 overflow-hidden relative"
              }`}
            >
              {/* 如果是折叠状态，加一个渐变遮罩提示有更多内容 */}
              {!item.isExpanded && (
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none" />
              )}

              {/* 可编辑的文本域 */}
              <textarea
                className="w-full w-full bg-transparent border-none resize-none focus:ring-2 focus:ring-blue-100 focus:bg-blue-50 rounded p-1 outline-none text-gray-700 leading-relaxed font-mono text-sm"
                value={item.content}
                onChange={(e) => handleUpdateContent(item.id, e.target.value)}
                rows={
                  item.isExpanded
                    ? Math.min(20, item.content.split("\n").length + 1)
                    : 3
                }
                placeholder="内容为空"
                // 只有展开时才允许编辑，防止误触
                readOnly={!item.isExpanded}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
