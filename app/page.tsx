"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div className="bg-amber-50 border-2 border-black">
      <Image
        src="/images/logo.png"
        alt="logo"
        width={100}
        height={100}
        className="rounded-full"
      />
      这里要实现登录页面
      <Input placeholder="请输入用户名" />
      <Input placeholder="请输入密码" />
      <Button>Login</Button>
    </div>
  );
}
