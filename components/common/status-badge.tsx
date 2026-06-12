import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  DRAFT: "초안",
  DATA_UPLOADED: "데이터 업로드",
  ANALYZED: "AI 분석 완료",
  REPORT_GENERATED: "보고서 생성",
  FEEDBACK_RECEIVED: "피드백 수신"
};

const variants: Record<string, "muted" | "science" | "success" | "accent" | "warning"> = {
  DRAFT: "muted",
  DATA_UPLOADED: "science",
  ANALYZED: "success",
  REPORT_GENERATED: "accent",
  FEEDBACK_RECEIVED: "warning"
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={variants[status] ?? "muted"}>{labels[status] ?? status}</Badge>;
}
