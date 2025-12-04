"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/login-form";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cookie = localStorage.getItem("maimemo_cookie");
    if (cookie) {
      router.push("/dashboard/notepad");
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLoginSuccess = (cookie: string) => {
    localStorage.setItem("maimemo_cookie", cookie);
    router.push("/dashboard/notepad");
  };

  if (loading) return null;

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

        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}
