import Link from "next/link";
import { ArrowLeft, BarChart3, ClipboardCheck, FileSpreadsheet, GraduationCap, MessageSquareText } from "lucide-react";
import { BrandLockup } from "@/components/common/brand-lockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const workflow = [
  {
    title: "1. 계정 만들기",
    body: "학생은 이름, 이메일, 비밀번호, 학교, 4자리 학번을 입력합니다. 교사는 교사 인증 코드를 입력하고 학번은 비워둡니다.",
    icon: GraduationCap
  },
  {
    title: "2. 실험 프로젝트 생성",
    body: "실험 제목, 목적, 가설, 독립변인, 종속변인, 통제변인, 준비물, 방법, 이론값, 실험 분야를 입력합니다.",
    icon: ClipboardCheck
  },
  {
    title: "3. 데이터 입력",
    body: "표에 직접 입력하거나 CSV/Excel 파일을 올립니다. 조건별 3회 이상 반복 측정값은 평균과 표준편차가 자동 계산됩니다.",
    icon: FileSpreadsheet
  },
  {
    title: "4. 그래프와 AI 분석",
    body: "AI가 적합한 그래프를 추천합니다. x축, y축, 그래프 유형은 학생이 직접 바꿀 수 있습니다.",
    icon: BarChart3
  },
  {
    title: "5. 보고서와 피드백",
    body: "AI 초안과 내 작성을 비교하면서 보고서를 수정합니다. 교사가 남긴 피드백은 학생 화면에서 다시 확인합니다.",
    icon: MessageSquareText
  }
];

const dataTips = [
  "측정값만 쓰지 말고 측정 기준과 단위를 함께 적습니다.",
  "예: 흡착 면적 cm², 색 농도 AU, 질량 g, 높이 cm, 온도 °C",
  "반복 측정은 trial_1, trial_2, trial_3처럼 3회 이상 입력합니다.",
  "조건 비교 실험은 condition 열에 조건 이름을 넣으면 그래프와 평균 비교가 쉬워집니다."
];

export default function ManualPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLockup />
          <nav className="flex flex-wrap items-center gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link href="/about">개발 동기</Link>
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
          <h1 className="mt-6 text-3xl font-black text-slate-950">LabInsight AI 사용 매뉴얼</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            처음 사용하는 학생과 교사가 바로 따라 할 수 있도록 입력 순서, 데이터 표 작성법, 그래프 선택,
            보고서 수정 방법을 정리했습니다.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-5">
        {workflow.map((item) => (
          <Card key={item.title}>
            <CardContent className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF0FF] text-science">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-black text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>데이터 입력 가이드</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dataTips.map((tip) => (
              <div key={tip} className="rounded-lg border border-border bg-slate-50 p-3 text-sm font-semibold leading-6">
                {tip}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>반복 측정 표 예시</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="border border-primary/20 px-3 py-2 text-left">condition</th>
                  <th className="border border-primary/20 px-3 py-2 text-left">measurement_basis</th>
                  <th className="border border-primary/20 px-3 py-2 text-left">unit</th>
                  <th className="border border-primary/20 px-3 py-2 text-right">trial_1</th>
                  <th className="border border-primary/20 px-3 py-2 text-right">trial_2</th>
                  <th className="border border-primary/20 px-3 py-2 text-right">trial_3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-2">활성탄 A</td>
                  <td className="border px-3 py-2">수단 III 기름 흡착 면적</td>
                  <td className="border px-3 py-2">cm²</td>
                  <td className="border px-3 py-2 text-right">10</td>
                  <td className="border px-3 py-2 text-right">11</td>
                  <td className="border px-3 py-2 text-right">9</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border px-3 py-2">모래</td>
                  <td className="border px-3 py-2">수단 III 기름 흡착 면적</td>
                  <td className="border px-3 py-2">cm²</td>
                  <td className="border px-3 py-2 text-right">3</td>
                  <td className="border px-3 py-2 text-right">4</td>
                  <td className="border px-3 py-2 text-right">3</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
