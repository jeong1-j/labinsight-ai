"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Loader2, LogIn } from "lucide-react";
import { BrandLockup } from "@/components/common/brand-lockup";
import { DatabaseStatusNotice } from "@/components/common/database-status-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDashboardPath } from "@/lib/roles";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("이메일과 비밀번호를 입력하세요.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false
    });
    if (!result?.ok) {
      setError("이메일 또는 비밀번호를 확인하세요.");
      setLoading(false);
      return;
    }

    const session = await waitForSession();
    router.replace(getDashboardPath(session?.user.role));
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <BrandLockup className="text-primary" />
          <CardTitle className="pt-4">학교 계정 로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <DatabaseStatusNotice />
          </div>
          <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                placeholder="가입한 이메일"
                autoComplete="email"
                required
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                placeholder="비밀번호"
                autoComplete="current-password"
                required
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              로그인
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            계정이 없나요?{" "}
            <Link className="font-bold text-science" href="/register">
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

async function waitForSession() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const session = await getSession();
    if (session?.user?.role) return session;
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
  return getSession();
}
