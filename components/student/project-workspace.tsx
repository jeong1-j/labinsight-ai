"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Loader2, Save, Sparkles } from "lucide-react";
import { ExperimentChart } from "@/components/charts/experiment-chart";
import {
  ExperimentHistoryComparison,
  type ExperimentComparisonItem
} from "@/components/student/experiment-history-comparison";
import { RepeatedMeasurementPanel } from "@/components/student/repeated-measurement-panel";
import { SpreadsheetDataGrid } from "@/components/student/spreadsheet-data-grid";
import { FeedbackForm } from "@/components/teacher/feedback-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { profileData, type DataRow } from "@/lib/chart-engine";
import { parseExperimentFile } from "@/lib/file-parser";
import { summarizeRepeatedMeasurements } from "@/lib/repeated-measurements";
import type { AppRole } from "@/lib/roles";

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
  createdAt: string;
  updatedAt: string;
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
  previousProjects,
  role
}: {
  project: ProjectForWorkspace;
  previousProjects: ExperimentComparisonItem[];
  role: AppRole;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<DataRow[]>(project.experimentData?.rawData?.length ? project.experimentData.rawData : emptyRows);
  const [analysis, setAnalysis] = useState(project.analysisResult);
  const [aiDraftContent, setAiDraftContent] = useState(project.report?.content ?? "");
  const [reportContent, setReportContent] = useState(project.report?.content ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"data" | "analysis" | "report" | "pdf" | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const profile = useMemo(() => profileData(rows), [rows]);
  const projectText = `${project.title} ${project.purpose} ${project.method} ${project.dependentVariable}`;
  const revisionHints = useMemo(
    () => buildRevisionHints(reportContent, rows, analysis, project.dependentVariable),
    [analysis, project.dependentVariable, reportContent, rows]
  );
  const canEdit = role === "STUDENT";

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
    const saved = await persistData();
    setBusy(null);
    setMessage(saved ? "실험 데이터가 저장되었습니다." : "데이터 저장에 실패했습니다.");
    if (saved) router.refresh();
  }

  async function persistData() {
    const response = await fetch(`/api/projects/${project.id}/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawData: normalizeRows(rows), uploadedFileName: null })
    });
    return response.ok;
  }

  async function runAnalysis() {
    setBusy("analysis");
    setMessage("");
    if (canEdit) {
      const saved = await persistData();
      if (!saved) {
        setBusy(null);
        setMessage("AI 분석 전 데이터 저장에 실패했습니다.");
        return;
      }
    }
    const response = await fetch(`/api/projects/${project.id}/analyze`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) {
      setMessage(data.error ?? "AI 분석에 실패했습니다.");
      return;
    }
    setAnalysis(data.analysisResult);
    setAiDraftContent((current) => current || data.reportDraft || "");
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
    setAiDraftContent(data.report.content);
    setReportContent((current) => current || data.report.content);
    setMessage(reportContent ? "AI 초안이 왼쪽 비교 칸에 갱신되었습니다." : "AI 보고서 초안이 생성되었습니다.");
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
          <SpreadsheetDataGrid rows={rows} onRowsChange={setRows} readOnly={!canEdit} />

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

      <RepeatedMeasurementPanel
        rows={rows}
        onRowsChange={setRows}
        dependentVariable={project.dependentVariable}
        projectText={projectText}
        readOnly={!canEdit}
      />

      {rows.length ? <ExperimentChart rows={normalizeRows(rows)} initialChartType={analysis?.chartType} /> : null}

      <ExperimentHistoryComparison
        currentProject={{
          id: project.id,
          title: project.title,
          field: project.field,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          analysisResult: analysis ? { errorRate: analysis.errorRate } : null
        }}
        previousProjects={previousProjects}
      />

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
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>AI 초안</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReportContent(aiDraftContent)}
                      disabled={!aiDraftContent}
                    >
                      내 작성으로 복사
                    </Button>
                  </div>
                  <pre className="min-h-[360px] whitespace-pre-wrap rounded-xl border border-border bg-slate-50 p-4 text-sm leading-7">
                    {aiDraftContent || "초안 생성 버튼을 누르면 AI 초안이 표시됩니다."}
                  </pre>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="studentReport">내 작성</Label>
                  <Textarea
                    id="studentReport"
                    value={reportContent}
                    onChange={(event) => setReportContent(event.target.value)}
                    className="min-h-[360px] font-mono text-sm"
                  />
                </div>
              </div>

              <RevisionGuide hints={revisionHints} />
            </>
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

      {role === "TEACHER" || role === "DEVELOPER" ? <FeedbackForm projectId={project.id} /> : null}

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

type RevisionHint = {
  title: string;
  underline: string;
  description: string;
};

function RevisionGuide({ hints }: { hints: RevisionHint[] }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black text-primary">보고서 수정 가이드</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            밑줄 표시된 항목을 내 작성 칸에 보완하면 보고서 완성도가 올라갑니다.
          </p>
        </div>
        <Badge variant={hints.length ? "warning" : "success"}>{hints.length ? `${hints.length}개 보완` : "보완 없음"}</Badge>
      </div>
      <div className="mt-4 grid gap-2">
        {hints.length ? (
          hints.map((hint) => (
            <div key={hint.title} className="rounded-lg bg-slate-50 p-3 text-sm leading-6">
              <p className="font-bold">{hint.title}</p>
              <p className="mt-1">
                <span className="underline decoration-danger decoration-2 underline-offset-4">{hint.underline}</span>
                <span className="text-muted-foreground"> - {hint.description}</span>
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            반복 측정, 측정 기준, 분석 결과가 보고서에 잘 반영되어 있습니다.
          </p>
        )}
      </div>
    </div>
  );
}

function buildRevisionHints(
  content: string,
  rows: DataRow[],
  analysis: ProjectForWorkspace["analysisResult"],
  dependentVariable: string
): RevisionHint[] {
  const hints: RevisionHint[] = [];
  const repeated = summarizeRepeatedMeasurements(normalizeRows(rows));

  if (!analysis) {
    hints.push({
      title: "AI 분석 결과 반영",
      underline: "결과 해석과 오차 원인 분석",
      description: "AI 분석 실행 후 해석, 가설 지지 여부, 오차 원인을 결론에 반영하세요."
    });
  }

  if (!repeated.hasRepeatedMeasurements) {
    hints.push({
      title: "반복 측정 보완",
      underline: "조건별 3회 이상 반복 측정",
      description: "평균과 표준편차를 보고서 데이터 해석에 포함하면 신뢰도를 설명할 수 있습니다."
    });
  } else if (!/표준편차|standard deviation|std/i.test(content)) {
    hints.push({
      title: "표준편차 해석 추가",
      underline: "평균과 표준편차",
      description: "조건별 평균뿐 아니라 표준편차가 큰 조건의 원인도 함께 설명하세요."
    });
  }

  if (repeated.numericColumnsNeedingBasis.length > 0 || !hasMeasurementBasis(rows)) {
    hints.push({
      title: "측정 기준 명시",
      underline: `${dependentVariable || "측정값"}의 단위와 기준`,
      description: "예: 흡착 면적(cm²), 색 농도, 흡광도처럼 숫자가 무엇을 뜻하는지 적으세요."
    });
  }

  if (/아직|먼저|추가 데이터를 확보|분석되지 않았습니다/.test(content)) {
    hints.push({
      title: "초안 문구 수정",
      underline: "아직 / 먼저 / 추가 데이터를 확보",
      description: "AI 초안의 임시 표현을 실제 실험 결과에 맞는 확정 문장으로 바꾸세요."
    });
  }

  if (!/개선|보완|후속/.test(content)) {
    hints.push({
      title: "개선 방향 추가",
      underline: "개선점과 후속 연구",
      description: "반복 측정 수, 통제 변인, 측정 위치 같은 다음 실험 개선 방향을 적으세요."
    });
  }

  return hints;
}

function hasMeasurementBasis(rows: DataRow[]) {
  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );
  return columns.some((column) => /basis|unit|단위|기준|cm|mm|m2|cm2|cm²|%|농도|면적|흡광|흡착/i.test(column));
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
