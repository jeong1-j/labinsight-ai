import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ClipboardCheck,
  FileText,
  LineChart,
  Microscope,
  Upload
} from "lucide-react";
import { BrandLockup } from "@/components/common/brand-lockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const analysisSteps = [
  "실험 프로젝트 생성",
  "CSV/Excel 또는 표 데이터 입력",
  "결측값·이상값 자동 점검",
  "그래프 추천과 AI 결과 해석",
  "오차 원인·변인 분석",
  "보고서 초안과 교사 피드백"
];

const featureCards = [
  {
    title: "데이터 업로드",
    body: "표 직접 입력, CSV, Excel 데이터를 저장하고 다시 조회합니다.",
    icon: Upload
  },
  {
    title: "그래프 자동 생성",
    body: "시간 흐름, 조건 비교, 변수 관계, 분포에 맞는 그래프를 추천합니다.",
    icon: LineChart
  },
  {
    title: "AI 실험 해석",
    body: "가설 지지 여부, 오차율, 숨겨진 변인, 개선 방법을 분석합니다.",
    icon: BrainCircuit
  },
  {
    title: "보고서 작성",
    body: "AI 초안을 학생이 수정하고 PDF로 다운로드할 수 있습니다.",
    icon: FileText
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLockup />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild variant="accent">
              <Link href="/register">회원가입</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="portal-grid border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:py-12">
          <div className="flex min-h-[420px] flex-col justify-center py-6 sm:py-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#EAF0FF] px-3 py-1 text-sm font-bold text-primary">
              <Microscope className="h-4 w-4" />
              학교 실험 데이터 분석 플랫폼
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              LabInsight AI
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              실험 데이터를 입력하면 그래프, 통계 요약, AI 해석, 오차 원인, 변인 분석, 보고서 초안까지 한
              흐름으로 정리합니다. 학생은 탐구 과정을 기록하고, 교사는 분석 결과를 검토해 피드백을 반환합니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="accent" size="lg">
                <Link href="/login">
                  실험 분석 시작
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/register">계정 만들기</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>분석 흐름</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {analysisSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-lg border border-border bg-slate-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold">{step}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="grid grid-cols-3 gap-3 p-5 text-center">
                <PortalMetric icon={ClipboardCheck} label="프로젝트" value="저장" />
                <PortalMetric icon={BarChart3} label="그래프" value="자동" />
                <PortalMetric icon={BrainCircuit} label="AI 분석" value="지원" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((feature) => (
          <Card key={feature.title}>
            <CardContent className="p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#EAF0FF] text-science">
                <feature.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-black text-slate-950">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}

function PortalMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof ClipboardCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[#F3F6FB] p-3">
      <Icon className="mx-auto h-5 w-5 text-science" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="font-black text-primary">{value}</p>
    </div>
  );
}
