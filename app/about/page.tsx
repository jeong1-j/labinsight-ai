import Link from "next/link";
import { ArrowLeft, CalendarDays, FlaskConical, Lightbulb, School, Target } from "lucide-react";
import { BrandLockup } from "@/components/common/brand-lockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const values = [
  { title: "탐구 설계", body: "가설, 변인, 통제 조건을 명확하게 정리해 실험을 설계합니다.", icon: Target },
  { title: "자료 해석", body: "반복 측정, 평균, 표준편차, 그래프를 바탕으로 결과를 읽습니다.", icon: FlaskConical },
  { title: "과학적 글쓰기", body: "AI 초안을 그대로 제출하지 않고 내 해석으로 보고서를 다듬습니다.", icon: Lightbulb },
  { title: "피드백 순환", body: "교사 피드백을 받아 다음 실험의 개선점으로 연결합니다.", icon: School }
];

const schedule = [
  ["1단계", "프로젝트 생성", "실험 목적, 가설, 변인, 준비물, 방법 입력"],
  ["2단계", "데이터 수집", "직접 표 입력 또는 CSV/Excel 업로드"],
  ["3단계", "분석", "그래프 추천, 오차 분석, 변인 분석 생성"],
  ["4단계", "보고서", "AI 초안과 내 작성 비교 후 수정"],
  ["5단계", "피드백", "교사 코멘트를 확인하고 후속 연구 계획 작성"]
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLockup />
          <nav className="flex flex-wrap items-center gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link href="/manual">사용 매뉴얼</Link>
            </Button>
            <Button asChild variant="accent">
              <Link href="/login">로그인</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              처음으로
            </Link>
          </Button>
          <h1 className="mt-6 text-3xl font-black text-slate-950">개발 동기</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            실험 수업에서는 데이터를 모으는 것보다 그 데이터를 해석하고, 오차를 설명하고, 다음 실험으로
            연결하는 과정이 더 어렵습니다. LabInsight AI는 학생이 실험 결과를 과학적으로 읽고 교사가
            빠르게 피드백할 수 있도록 만든 학교용 실험 분석 플랫폼입니다.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
        {values.map((value) => (
          <Card key={value.title}>
            <CardContent className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF0FF] text-science">
                <value.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-black text-slate-950">{value.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{value.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>운영 방향</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <p>
              이 플랫폼은 정답을 대신 써주는 도구가 아니라 실험 과정을 더 잘 기록하고 해석하도록 돕는
              보조 도구입니다.
            </p>
            <p>
              학생은 AI 초안을 참고하되 자신의 판단으로 수정하고, 교사는 대시보드에서 학생별 분석 결과와
              보고서 상태를 확인해 구체적인 피드백을 남깁니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-science" />
              실험 분석 일정 예시
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-sm">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="border border-primary/20 px-3 py-2 text-left">단계</th>
                  <th className="border border-primary/20 px-3 py-2 text-left">활동</th>
                  <th className="border border-primary/20 px-3 py-2 text-left">내용</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(([step, activity, detail], index) => (
                  <tr key={step} className={index % 2 ? "bg-slate-50" : "bg-white"}>
                    <td className="border px-3 py-2 font-bold text-primary">{step}</td>
                    <td className="border px-3 py-2 font-semibold">{activity}</td>
                    <td className="border px-3 py-2 text-muted-foreground">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
