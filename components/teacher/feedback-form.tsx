"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FeedbackForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch(`/api/projects/${projectId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setLoading(false);
    if (!response.ok) {
      setMessage("피드백 저장에 실패했습니다.");
      return;
    }
    setMessage("피드백이 학생에게 반환되었습니다.");
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>교사 피드백 작성</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <FeedbackField name="strengths" label="좋은 점" />
          <FeedbackField name="improvements" label="보완할 점" />
          <FeedbackField name="suggestion" label="추가 실험 제안" />
          <FeedbackField name="finalComment" label="최종 코멘트" />
          {message ? <p className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-primary">{message}</p> : null}
          <Button type="submit" variant="accent" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            피드백 저장
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function FeedbackField({ name, label }: { name: string; label: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} required />
    </div>
  );
}
