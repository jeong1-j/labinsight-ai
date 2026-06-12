import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BarChart3, ClipboardCheck, Database, ShieldCheck, Users, UsersRound } from "lucide-react";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SidebarShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { StudentProgressTable } from "@/components/teacher/student-progress-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DeveloperDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "DEVELOPER") redirect(session.user.role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/student");

  const [students, teachers, developerCount, projectCount, dataCount, analyzedCount, projects] = await Promise.all([
    prisma.user.findMany({
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
    }),
    prisma.user.findMany({
      where: { role: Role.TEACHER },
      orderBy: [{ school: "asc" }, { name: "asc" }]
    }),
    prisma.user.count({ where: { role: Role.DEVELOPER } }),
    prisma.project.count(),
    prisma.experimentData.count(),
    prisma.analysisResult.count(),
    prisma.project.findMany({
      include: {
        student: true,
        experimentData: true,
        analysisResult: true,
        report: true,
        feedbacks: true
      },
      orderBy: { updatedAt: "desc" },
      take: 10
    })
  ]);

  return (
    <SidebarShell role="DEVELOPER" userName={session.user.name ?? "개발자"}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-science">개발자 대시보드</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">전체 계정과 실험 데이터 운영 보기</h1>
          </div>
          <Button asChild variant="accent">
            <Link href="/dashboard/teacher">
              <ShieldCheck className="h-4 w-4" />
              교사용 화면 열기
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="학생 계정" value={students.length} icon={Users} />
          <StatCard title="교사 계정" value={teachers.length} icon={UsersRound} />
          <StatCard title="개발자 계정" value={developerCount} icon={ShieldCheck} />
          <StatCard title="전체 프로젝트" value={projectCount} icon={ClipboardCheck} />
          <StatCard title="분석 완료" value={analyzedCount} icon={BarChart3} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-science" />
                최근 프로젝트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {projects.length ? (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className="grid gap-3 rounded-xl border border-border bg-white p-4 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold">{project.title}</h2>
                          <StatusBadge status={project.status} />
                          <Badge variant={project.experimentData ? "success" : "muted"}>
                            {project.experimentData ? "데이터 저장" : "데이터 없음"}
                          </Badge>
                          <Badge variant={project.analysisResult ? "science" : "muted"}>
                            {project.analysisResult ? "AI 분석" : "분석 전"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {project.student.name} · {project.student.gradeOrClass || "-"} · {project.field}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/projects/${project.id}`}>상세 보기</Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <p className="font-bold">아직 생성된 프로젝트가 없습니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>교사 계정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {teachers.length ? (
                  teachers.map((teacher) => (
                    <div key={teacher.id} className="rounded-xl border border-border bg-slate-50 p-4">
                      <p className="font-bold">{teacher.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{teacher.email}</p>
                      <p className="text-sm text-muted-foreground">{teacher.school || "-"}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-border p-5 text-sm font-semibold text-muted-foreground">
                    등록된 교사 계정이 없습니다.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="success">데이터 저장 {dataCount}건</Badge>
            <Badge variant="science">AI 분석 {analyzedCount}건</Badge>
          </div>
          <StudentProgressTable students={JSON.parse(JSON.stringify(students))} />
        </div>
      </div>
    </SidebarShell>
  );
}
