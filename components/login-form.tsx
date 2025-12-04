"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginFormProps {
  onLoginSuccess: (cookie: string) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cookieInput, setCookieInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"account" | "cookie">("account");

  const handleAccountLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLoginSuccess(data.cookie);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCookieLogin = () => {
    if (!cookieInput.trim()) {
      setError("Cookie cannot be empty");
      return;
    }
    onLoginSuccess(cookieInput);
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">MaiMemo Login</h2>

      <div className="flex space-x-2 mb-4">
        <Button
          variant={mode === "account" ? "default" : "outline"}
          onClick={() => setMode("account")}
        >
          Account
        </Button>
        <Button
          variant={mode === "cookie" ? "default" : "outline"}
          onClick={() => setMode("cookie")}
        >
          Cookie
        </Button>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {mode === "account" ? (
        <div className="space-y-3">
          <Input
            placeholder="Email / Phone"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={handleAccountLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            placeholder="Paste cookie string here..."
            value={cookieInput}
            onChange={(e) => setCookieInput(e.target.value)}
          />
          <Button className="w-full" onClick={handleCookieLogin}>
            Use Cookie
          </Button>
        </div>
      )}
    </div>
  );
}
