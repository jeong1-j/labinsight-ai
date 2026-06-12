import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AlertTriangle, BarChart3, ClipboardCheck, FileText, Hourglass, Percent, Users } from "lucide-react";
import { ProjectStatus, Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SidebarShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { StudentProgressTable } from "@/components/teacher/student-progress-table";

export default async function TeacherDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "TEACHER") redirect("/dashboard/student");

  const students = await prisma.user.findMany({
    where: { role: Role.STUDENT },
    include: {
      projects: {
        include: {
          experimentData: true,
          analysisResult: true,
          report: true,
          feedbacks: true
        },
        orderBy: { updatedAt: "desc" }
      }
    },
    orderBy: [{ school: "asc" }, { gradeOrClass: "asc" }, { name: "asc" }]
  });

  const projects = students.flatMap((student) => student.projects);
  const reportCount = projects.filter((project) => project.report).length;
  const needsFeedbackStatuses = new Set<ProjectStatus>([ProjectStatus.ANALYZED, ProjectStatus.REPORT_GENERATED]);
  const feedbackWaitingCount = projects.filter(
    (project) => project.feedbacks.length === 0 && needsFeedbackStatuses.has(project.status)
  ).length;

  const analyzedCount = projects.filter((project) => project.analysisResult).length;
  const errorRates = projects
    .map((project) => project.analysisResult?.errorRate)
    .filter((value): value is number => typeof value === "number");
  const averageErrorRate = errorRates.length
    ? Number((errorRates.reduce((sum, value) => sum + value, 0) / errorRates.length).toFixed(1))
    : 0;

  const noProjectCount = students.filter((student) => student.projects.length === 0).length;
  const highErrorCount = projects.filter((project) => (project.analysisResult?.errorRate ?? 0) >= 15).length;
  const weakVariableCount = projects.filter((project) => {
    const variableText = JSON.stringify(project.analysisResult?.variableAnalysis ?? {});
    return variableText.includes("부족") || variableText.includes("통제") || variableText.includes("숨겨진");
  }).length;

  return (
    <SidebarShell role="TEACHER" userName={session.user.name ?? "교사"}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div>
          <p className="text-sm font-bold text-science">교사용 대시보드</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">학생 실험 분석 관리</h1>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard title="전체 학생 수" value={students.length} icon={Users} />
          <StatCard title="전체 프로젝트" value={projects.length} icon={ClipboardCheck} />
          <StatCard title="분석 완료" value={analyzedCount} icon={BarChart3} />
          <StatCard title="보고서 제출" value={reportCount} icon={FileText} />
          <StatCard title="피드백 대기" value={feedbackWaitingCount} icon={Hourglass} />
          <StatCard title="평균 오차율" value={`${averageErrorRate}%`} icon={Percent} />
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
            <p className="font-black text-amber-950">AI 지도 알림</p>
            <Badge variant={highErrorCount ? "danger" : "success"}>오차율 15% 이상 {highErrorCount}건</Badge>
            <Badge variant={weakVariableCount ? "warning" : "success"}>변인 보완 필요 {weakVariableCount}건</Badge>
            <Badge variant={feedbackWaitingCount ? "warning" : "success"}>피드백 대기 {feedbackWaitingCount}건</Badge>
            <Badge variant={noProjectCount ? "muted" : "success"}>프로젝트 미생성 학생 {noProjectCount}명</Badge>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
            학생 행의 상세 보기에서 AI 분석 결과를 확인하고 피드백을 저장하면 학생 대시보드와 프로젝트 상세 화면에 바로 표시됩니다.
          </p>
        </div>

        <div className="mt-6">
          <StudentProgressTable students={JSON.parse(JSON.stringify(students))} />
        </div>
      </div>
    </SidebarShell>
  );
}
