"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [cookie, setCookie] = useState<string | null>(null);

  useEffect(() => {
    const storedCookie = localStorage.getItem("maimemo_cookie");
    if (!storedCookie) {
      router.push("/");
    } else {
      setCookie(storedCookie);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("maimemo_cookie");
    router.push("/");
  };

  if (!cookie) return null;

  const navItems = [
    { name: "Notepad Sync", href: "/dashboard/notepad" },
    { name: "My Phrases", href: "/dashboard/phrase" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">MaiMemo Sync</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
