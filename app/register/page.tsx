"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Loader2, UserPlus } from "lucide-react";
import { BrandLockup } from "@/components/common/brand-lockup";
import { DatabaseStatusNotice } from "@/components/common/database-status-notice";
import { SchoolSearch } from "@/components/common/school-search";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getDashboardPath, type AppRole } from "@/lib/roles";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<AppRole>("STUDENT");
  const [school, setSchool] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const email = String(payload.email ?? "").trim().toLowerCase();
    const password = String(payload.password ?? "");
    const normalizedSchool = role === "DEVELOPER" ? school.trim() || "LabInsight AI" : school.trim();
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, email, password, role, school: normalizedSchool })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "회원가입에 실패했습니다.");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    if (!signInResult?.ok) {
      setError("회원가입은 완료됐지만 자동 로그인에 실패했습니다. 로그인 화면에서 다시 시도하세요.");
      setLoading(false);
      return;
    }

    const session = await waitForSession();
    router.replace(getDashboardPath(session?.user.role));
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="items-center text-center">
          <BrandLockup className="text-primary" />
          <CardTitle className="pt-4">LabInsight AI 회원가입</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <DatabaseStatusNotice />
          </div>
          <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={handleSubmit}>
            <Field label="이름" name="name" placeholder="이름" autoComplete="name" />
            <Field label="이메일" name="email" type="email" placeholder="school@example.kr" autoComplete="email" />
            <Field
              label="비밀번호"
              name="password"
              type="password"
              placeholder="8자 이상"
              autoComplete="new-password"
            />
            <div className="grid gap-2">
              <Label htmlFor="role">역할</Label>
              <Select
                id="role"
                value={role}
                onChange={(event) => {
                  const nextRole = event.target.value as typeof role;
                  setRole(nextRole);
                  if (nextRole === "DEVELOPER") setSchool("LabInsight AI");
                  if (role === "DEVELOPER" && nextRole !== "DEVELOPER") setSchool("");
                }}
              >
                <option value="STUDENT">학생</option>
                <option value="TEACHER">교사</option>
                <option value="DEVELOPER">개발자</option>
              </Select>
            </div>

            {role === "DEVELOPER" ? (
              <div className="rounded-lg border border-border bg-[#F3F6FB] p-4 text-sm font-semibold text-muted-foreground sm:col-span-2">
                개발자 계정은 학교 선택 없이 생성됩니다. 개발자 인증 코드만 정확히 입력하면 기존 이메일도 개발자
                계정으로 전환됩니다.
              </div>
            ) : (
              <SchoolSearch value={school} onChange={(selected) => setSchool(selected.name)} />
            )}

            {role === "STUDENT" ? (
              <Field label="학번" name="studentNumber" placeholder="4자리 숫자" inputMode="numeric" pattern="\d{4}" />
            ) : (
              <div className="rounded-lg border border-border bg-[#F3F6FB] p-4 text-sm font-semibold text-muted-foreground sm:col-span-2">
                교사/개발자 계정은 학번이나 담당 반을 입력하지 않습니다.
              </div>
            )}

            {role === "TEACHER" ? (
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="teacherCode">교사 인증 코드</Label>
                <Input id="teacherCode" name="teacherCode" placeholder="JSHS_TEACHER_2026" required />
              </div>
            ) : null}

            {role === "DEVELOPER" ? (
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="developerCode">개발자 인증 코드</Label>
                <Input id="developerCode" name="developerCode" placeholder="LABINSIGHT_DEV_2026" required />
              </div>
            ) : null}

            {error ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-danger sm:col-span-2">{error}</p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
              <Link className="text-sm font-bold text-science" href="/login">
                이미 계정이 있어요
              </Link>
              <Button type="submit" variant="accent" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                가입하기
              </Button>
            </div>
          </form>
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

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  autoComplete,
  inputMode,
  pattern
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
        required
      />
    </div>
  );
}
