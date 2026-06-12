"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { ExperimentChart } from "@/components/charts/experiment-chart";
import { FeedbackForm } from "@/components/teacher/feedback-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { profileData, type DataRow } from "@/lib/chart-engine";
import { parseExperimentFile } from "@/lib/file-parser";

type JsonObject = Record<string, unknown>;

type ProjectForWorkspace = {
  id: string;
  title: string;
  purpose: string;
  hypothesis: string;
  independentVariable: string;
  dependentVariable: string;
  controlledVariables: string;
  materials: string;
  method: string;
  theoryValue: string | null;
  field: string;
  status: string;
  student: {
    name: string;
    email: string;
    school: string;
    gradeOrClass: string;
  };
  experimentData: {
    rawData: DataRow[];
    columns: JsonObject;
    uploadedFileName: string | null;
  } | null;
  analysisResult: {
    chartType: string;
    summaryStats: JsonObject;
    interpretation: string;
    hypothesisResult: string;
    errorRate: number | null;
    errorAnalysis: JsonObject;
    variableAnalysis: JsonObject;
    researchSuggestions: unknown;
  } | null;
  report: {
    content: string;
  } | null;
  feedbacks: {
    id: string;
    strengths: string;
    improvements: string;
    suggestion: string;
    finalComment: string;
    createdAt: string;
    teacher?: {
      name: string;
    };
  }[];
};

const emptyRows: DataRow[] = [
  { day: 1, value: "" },
  { day: 2, value: "" },
  { day: 3, value: "" }
];

export function ProjectWorkspace({
  project,
  role
}: {
  project: ProjectForWorkspace;
  role: "STUDENT" | "TEACHER";
}) {
  const router = useRouter();
  const [rows, setRows] = useState<DataRow[]>(project.experimentData?.rawData?.length ? project.experimentData.rawData : emptyRows);
  const [analysis, setAnalysis] = useState(project.analysisResult);
  const [reportContent, setReportContent] = useState(project.report?.content ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"data" | "analysis" | "report" | "pdf" | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const columns = useMemo(() => Object.keys(rows[0] ?? { day: "", value: "" }), [rows]);
  const profile = useMemo(() => profileData(rows), [rows]);
  const canEdit = role === "STUDENT";

  function updateCell(rowIndex: number, column: string, value: string) {
    setRows((current) =>
      current.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              [column]: value
            }
          : row
      )
    );
  }

  function addRow() {
    setRows((current) => [...current, Object.fromEntries(columns.map((column) => [column, ""]))]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  function addColumn() {
    const name = window.prompt("새 컬럼명");
    if (!name) return;
    setRows((current) => current.map((row) => ({ ...row, [name]: "" })));
  }

  async function handleFile(file?: File) {
    if (!file) return;
    try {
      const parsed = await parseExperimentFile(file);
      setRows(parsed);
      setMessage(`${file.name} 파일을 불러왔습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "파일을 읽을 수 없습니다.");
    }
  }

  async function saveData() {
    setBusy("data");
    setMessage("");
    const response = await fetch(`/api/projects/${project.id}/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawData: normalizeRows(rows), uploadedFileName: null })
    });
    setBusy(null);
    if (!response.ok) {
      setMessage("데이터 저장에 실패했습니다.");
      return;
    }
    setMessage("실험 데이터가 저장되었습니다.");
    router.refresh();
  }

  async function runAnalysis() {
    setBusy("analysis");
    setMessage("");
    const response = await fetch(`/api/projects/${project.id}/analyze`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) {
      setMessage(data.error ?? "AI 분석에 실패했습니다.");
      return;
    }
    setAnalysis(data.analysisResult);
    setReportContent((current) => current || data.reportDraft || "");
    setMessage("AI 분석 결과가 생성되었습니다.");
    router.refresh();
  }

  async function generateReport() {
    setBusy("report");
    setMessage("");
    const response = await fetch(`/api/projects/${project.id}/report`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) {
      setMessage(data.error ?? "보고서 생성에 실패했습니다.");
      return;
    }
    setReportContent(data.report.content);
    setMessage("AI 보고서 초안이 생성되었습니다.");
    router.refresh();
  }

  async function saveReport() {
    setBusy("report");
    const response = await fetch(`/api/projects/${project.id}/report`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reportContent })
    });
    setBusy(null);
    setMessage(response.ok ? "보고서가 저장되었습니다." : "보고서 저장에 실패했습니다.");
    if (response.ok) router.refresh();
  }

  async function downloadPdf() {
    if (!reportRef.current) return;
    setBusy("pdf");
    const html2pdf = (await import("html2pdf.js")).default;
    await html2pdf()
      .set({
        margin: 10,
        filename: `${project.title}-LabInsightAI.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .from(reportRef.current)
      .save();
    setBusy(null);
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-sm font-bold text-science">{project.field}</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">{project.title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{project.purpose}</p>
          </div>
          <div className="rounded-xl bg-[#F3F6FB] p-4">
            <p className="text-xs font-bold text-muted-foreground">학생 정보</p>
            <p className="mt-2 font-black">{project.student.name}</p>
            <p className="text-sm text-muted-foreground">학번 {project.student.gradeOrClass || "-"}</p>
            <p className="text-sm text-muted-foreground">{project.student.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>실험 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Info label="가설" value={project.hypothesis} />
          <Info label="독립변인" value={project.independentVariable} />
          <Info label="종속변인" value={project.dependentVariable} />
          <Info label="통제변인" value={project.controlledVariables} />
          <Info label="이론값" value={project.theoryValue ?? "-"} />
          <Info label="준비물" value={project.materials} />
          <div className="md:col-span-2">
            <Info label="실험 방법" value={project.method} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>실험 데이터</CardTitle>
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={addColumn}>
                <Plus className="h-4 w-4" />
                컬럼
              </Button>
              <Button variant="outline" onClick={addRow}>
                <Plus className="h-4 w-4" />
                행
              </Button>
              <Button variant="science" onClick={saveData} disabled={busy === "data"}>
                {busy === "data" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                데이터 저장
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <div className="mb-4 grid gap-2">
              <Label htmlFor="file">CSV/Excel 업로드</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="border-b border-border px-3 py-2 text-left font-bold">
                      {column}
                    </th>
                  ))}
                  {canEdit ? <th className="border-b border-border px-3 py-2" /> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-border">
                    {columns.map((column) => (
                      <td key={column} className="px-2 py-2">
                        {canEdit ? (
                          <Input
                            value={String(row[column] ?? "")}
                            onChange={(event) => updateCell(rowIndex, column, event.target.value)}
                            className="h-9"
                          />
                        ) : (
                          <span className="px-2">{String(row[column] ?? "")}</span>
                        )}
                      </td>
                    ))}
                    {canEdit ? (
                      <td className="w-12 px-2 py-2">
                        <Button variant="outline" size="icon" onClick={() => removeRow(rowIndex)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <QualityBadge label="행" value={`${profile.rowCount}개`} />
            <QualityBadge label="숫자 컬럼" value={`${profile.numericColumns.length}개`} />
            <QualityBadge label="문자 컬럼" value={`${profile.textColumns.length}개`} />
            <QualityBadge label="반복 측정" value={profile.hasRepeatedMeasurements ? "감지" : "미감지"} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.columns
              .filter((column) => column.missing > 0 || column.outliers > 0)
              .map((column) => (
                <Badge key={column.name} variant={column.outliers ? "warning" : "muted"}>
                  {column.name}: 결측 {column.missing}, 이상값 {column.outliers}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      {rows.length ? <ExperimentChart rows={normalizeRows(rows)} initialChartType={analysis?.chartType} /> : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>AI 분석 결과</CardTitle>
          {canEdit ? (
            <Button variant="accent" onClick={runAnalysis} disabled={busy === "analysis"}>
              {busy === "analysis" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI 분석 실행
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4">
          {analysis ? (
            <>
              <ResultBlock label="결과 해석" value={analysis.interpretation} />
              <ResultBlock label="가설 지지 여부" value={analysis.hypothesisResult} />
              <ResultBlock label="오차율" value={`${analysis.errorRate ?? "-"}%`} />
              <ObjectBlock title="AI 오차 원인 분석" data={analysis.errorAnalysis} />
              <ObjectBlock title="AI 변인 분석" data={analysis.variableAnalysis} />
              <ObjectBlock title="후속 연구 제안" data={analysis.researchSuggestions} />
            </>
          ) : (
            <p className="rounded-xl bg-slate-50 p-5 text-sm font-semibold text-muted-foreground">
              데이터 저장 후 AI 분석을 실행하면 결과 해석, 오차 원인, 변인 분석이 표시됩니다.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>AI 보고서 초안</CardTitle>
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={generateReport} disabled={busy === "report"}>
                <FileSpreadsheet className="h-4 w-4" />
                초안 생성
              </Button>
              <Button variant="science" onClick={saveReport} disabled={!reportContent || busy === "report"}>
                <Save className="h-4 w-4" />
                저장
              </Button>
              <Button variant="accent" onClick={downloadPdf} disabled={!reportContent || busy === "pdf"}>
                {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                PDF
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4">
          {canEdit ? (
            <Textarea
              value={reportContent}
              onChange={(event) => setReportContent(event.target.value)}
              className="min-h-[360px] font-mono text-sm"
            />
          ) : (
            <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-5 text-sm leading-7">{reportContent || "보고서 없음"}</pre>
          )}
          <div ref={reportRef} className="print-safe rounded-xl bg-white p-8 text-slate-950">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
              <Image src="/school-logo.png" alt="학교 로고" width={64} height={64} className="object-contain" />
              <div>
                <h2 className="text-2xl font-black">LabInsight AI</h2>
                <p className="font-bold text-slate-600">전남과학고 실험 데이터 분석 플랫폼</p>
              </div>
            </div>
            <h1 className="mt-8 text-3xl font-black">{project.title}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {project.student.name} · 학번 {project.student.gradeOrClass || "-"}
            </p>
            <pre className="mt-8 whitespace-pre-wrap text-sm leading-7">{reportContent}</pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>교사 피드백</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {project.feedbacks.length ? (
            project.feedbacks.map((feedback) => (
              <div key={feedback.id} className="rounded-xl border border-border bg-slate-50 p-4">
                <p className="text-sm font-bold text-primary">{feedback.teacher?.name ?? "교사"} 피드백</p>
                <div className="mt-3 grid gap-2 text-sm">
                  <p>
                    <b>좋은 점:</b> {feedback.strengths}
                  </p>
                  <p>
                    <b>보완할 점:</b> {feedback.improvements}
                  </p>
                  <p>
                    <b>추가 실험:</b> {feedback.suggestion}
                  </p>
                  <p>
                    <b>최종 코멘트:</b> {feedback.finalComment}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl bg-slate-50 p-5 text-sm font-semibold text-muted-foreground">아직 피드백이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      {role === "TEACHER" ? <FeedbackForm projectId={project.id} /> : null}

      {message ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-white shadow-portal">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6">{value}</p>
    </div>
  );
}

function QualityBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F3F6FB] p-4">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-1 font-black text-primary">{value}</p>
    </div>
  );
}

function ResultBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{value}</p>
    </div>
  );
}

function ObjectBlock({ title, data }: { title: string; data: unknown }) {
  const entries: [string, unknown][] = Array.isArray(data)
    ? data.map((value, index) => [String(index + 1), value])
    : Object.entries((data ?? {}) as Record<string, unknown>);
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs font-bold text-muted-foreground">{title}</p>
      <div className="mt-3 grid gap-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-lg bg-slate-50 p-3 text-sm leading-6">
            <b>{key}</b> {String(value)}
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeRows(rows: DataRow[]): DataRow[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => {
        if (value === null || value === undefined) return [key, null];
        if (value === "") return [key, null];
        const number = Number(value);
        return Number.isFinite(number) && String(value).trim() !== "" ? [key, number] : [key, value];
      })
    )
  );
}
