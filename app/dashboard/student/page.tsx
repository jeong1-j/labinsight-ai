import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BarChart3, ClipboardList, Eye, MessageSquareText, Plus, ScrollText, Table2 } from "lucide-react";
import { ProjectStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SidebarShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DataRow = Record<string, string | number | boolean | null>;

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "TEACHER") redirect("/dashboard/teacher");
  if (session.user.role === "DEVELOPER") redirect("/dashboard/developer");

  const projects = await prisma.project.findMany({
    where: { studentId: session.user.id },
    include: {
      experimentData: true,
      analysisResult: true,
      report: true,
      feedbacks: {
        include: {
          teacher: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const analyzedStatuses = new Set<ProjectStatus>([
    ProjectStatus.ANALYZED,
    ProjectStatus.REPORT_GENERATED,
    ProjectStatus.FEEDBACK_RECEIVED
  ]);
  const analyzedCount = projects.filter((project) => analyzedStatuses.has(project.status)).length;
  const reportCount = projects.filter((project) => project.report).length;
  const feedbackCount = projects.reduce((sum, project) => sum + project.feedbacks.length, 0);
  const recentFeedbacks = projects
    .flatMap((project) =>
      project.feedbacks.map((feedback) => ({
        ...feedback,
        projectTitle: project.title,
        projectId: project.id
      }))
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return (
    <SidebarShell role="STUDENT" userName={session.user.name ?? "학생"}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-science">학생 대시보드</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">나의 실험 프로젝트와 데이터</h1>
          </div>
          <Button asChild variant="accent">
            <Link href="/projects/new">
              <Plus className="h-4 w-4" />새 실험 프로젝트
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="총 프로젝트 수" value={projects.length} icon={ClipboardList} />
          <StatCard title="AI 분석 완료" value={analyzedCount} icon={BarChart3} />
          <StatCard title="보고서 생성" value={reportCount} icon={ScrollText} />
          <StatCard title="교사 피드백" value={feedbackCount} icon={MessageSquareText} />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-science" />
              교사 피드백함
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {recentFeedbacks.length ? (
                recentFeedbacks.map((feedback) => (
                  <div key={feedback.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-primary">{feedback.projectTitle}</p>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                          {feedback.teacher?.name ?? "교사"} · {formatDate(feedback.createdAt)}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/projects/${feedback.projectId}`}>
                          <Eye className="h-4 w-4" />
                          확인
                        </Link>
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm leading-6">
                      <p>
                        <b>좋은 점:</b> {feedback.strengths}
                      </p>
                      <p>
                        <b>보완할 점:</b> {feedback.improvements}
                      </p>
                      <p>
                        <b>최종 코멘트:</b> {feedback.finalComment}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <p className="font-bold">아직 받은 피드백이 없습니다.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    교사가 프로젝트 상세 화면에서 피드백을 저장하면 이곳에 표시됩니다.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>최근 실험 프로젝트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {projects.length ? (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold">{project.title}</h2>
                        <StatusBadge status={project.status} />
                        <Badge variant={project.experimentData ? "success" : "muted"}>
                          {project.experimentData ? "데이터 저장됨" : "데이터 없음"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {project.field} · 오차율 {project.analysisResult?.errorRate ?? "-"}%
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/projects/${project.id}`}>
                        <Eye className="h-4 w-4" />
                        프로젝트 보기
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <p className="font-bold">아직 프로젝트가 없습니다.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    첫 실험 프로젝트를 만들고 데이터를 업로드해 보세요.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table2 className="h-5 w-5 text-science" />
              내가 입력한 실험 데이터
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {projects.length ? (
                projects.map((project) => {
                  const rows = getDataRows(project.experimentData?.rawData);
                  const columns = rows.length ? Object.keys(rows[0]).slice(0, 6) : [];

                  return (
                    <div key={project.id} className="rounded-xl border border-border bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-bold">{project.title}</h2>
                            <Badge variant={rows.length ? "science" : "muted"}>{rows.length}행</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {project.experimentData?.uploadedFileName
                              ? `업로드 파일: ${project.experimentData.uploadedFileName}`
                              : rows.length
                                ? "직접 입력 또는 저장된 표 데이터"
                                : "아직 저장된 데이터가 없습니다."}
                          </p>
                        </div>
                        <Button asChild variant="accent" size="sm">
                          <Link href={`/projects/${project.id}`}>
                            <Eye className="h-4 w-4" />
                            전체 데이터 보기
                          </Link>
                        </Button>
                      </div>

                      {rows.length ? (
                        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                          <table className="w-full min-w-[560px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                              <tr>
                                {columns.map((column) => (
                                  <th key={column} className="px-3 py-2">
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rows.slice(0, 3).map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-t border-border">
                                  {columns.map((column) => (
                                    <td key={column} className="px-3 py-2">
                                      {formatCell(row[column])}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-lg border border-dashed border-border bg-slate-50 p-5 text-sm font-semibold text-muted-foreground">
                          이 프로젝트에는 아직 데이터가 저장되지 않았습니다. 프로젝트 보기에서 표를 입력하거나 CSV/Excel을
                          업로드하세요.
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <p className="font-bold">표시할 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarShell>
  );
}

function getDataRows(value: unknown): DataRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is DataRow => row !== null && typeof row === "object" && !Array.isArray(row));
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}
