"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const fields = ["생명과학", "화학", "물리", "지구과학", "환경", "융합과학", "기타"];

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (session?.user.role === "TEACHER") router.replace("/dashboard/teacher");
    if (session?.user.role === "DEVELOPER") router.replace("/dashboard/developer");
  }, [router, session?.user.role, status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "프로젝트 생성에 실패했습니다.");
      return;
    }
    router.push(`/projects/${data.project.id}`);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>새 실험 프로젝트 만들기</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <Field label="실험 제목" name="title" />
              <div className="grid gap-2">
                <Label htmlFor="field">실험 분야</Label>
                <Select id="field" name="field" required>
                  {fields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </Select>
              </div>
              <Area label="실험 목적" name="purpose" />
              <Area label="가설" name="hypothesis" />
              <Field label="독립변인" name="independentVariable" />
              <Field label="종속변인" name="dependentVariable" />
              <Area label="통제변인" name="controlledVariables" />
              <Field label="이론값" name="theoryValue" required={false} />
              <Area label="준비물" name="materials" />
              <Area label="실험 방법" name="method" />
              {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-danger md:col-span-2">{error}</p> : null}
              <div className="flex justify-end md:col-span-2">
                <Button type="submit" variant="accent" disabled={loading || status === "loading"}>
                  {loading || status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  프로젝트 생성
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  required = true
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} />
    </div>
  );
}

function Area({ label, name }: { label: string; name: string }) {
  return (
    <div className="grid gap-2 md:col-span-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} required />
    </div>
  );
}
