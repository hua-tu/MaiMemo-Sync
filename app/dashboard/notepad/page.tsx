"use client";

import { useEffect, useState } from "react";
import { NotepadSync } from "@/components/notepad-sync";

export default function NotepadPage() {
  const [cookie, setCookie] = useState<string | null>(null);

  useEffect(() => {
    const storedCookie = localStorage.getItem("maimemo_cookie");
    setCookie(storedCookie);
  }, []);

  if (!cookie) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Notepad Synchronization
      </h2>
      <NotepadSync cookie={cookie} />
    </div>
  );
}
