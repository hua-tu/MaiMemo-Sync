"use client";

import Image from "next/image";
import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { NotepadSync } from "@/components/notepad-sync";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [cookie, setCookie] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center">
          <Image
            src="/images/logo.png"
            alt="logo"
            width={100}
            height={100}
            className="rounded-full mx-auto"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            MaiMemo Sync
          </h2>
        </div>

        {!cookie ? (
          <LoginForm onLoginSuccess={setCookie} />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-4">
              <span className="text-sm text-green-600 font-medium">
                Logged in
              </span>
              <Button variant="ghost" size="sm" onClick={() => setCookie(null)}>
                Logout
              </Button>
            </div>
            <NotepadSync cookie={cookie} />
          </div>
        )}
      </div>
    </div>
  );
}
