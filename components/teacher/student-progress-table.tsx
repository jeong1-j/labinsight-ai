"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Filter, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/common/status-badge";

type StudentProject = {
  id: string;
  title: string;
  field: string;
  status: string;
  experimentData: unknown | null;
  analysisResult: {
    errorRate: number | null;
    variableAnalysis: unknown;
  } | null;
  report: unknown | null;
  feedbacks: unknown[];
  updatedAt: string;
};

export type TeacherStudentProgress = {
  id: string;
  name: string;
  email: string;
  school: string;
  gradeOrClass: string;
  projects: StudentProject[];
};

const filterLabels = {
  all: "전체 학생",
  noProject: "프로젝트 없음",
  noData: "데이터 대기",
  analyzed: "분석 완료",
  noReport: "보고서 미생성",
  highError: "오차율 높음",
  weakVariable: "변인 보완",
  feedbackWaiting: "피드백 대기"
};

export function StudentProgressTable({ students }: { students: TeacherStudentProgress[] }) {
  const [filter, setFilter] = useState<keyof typeof filterLabels>("all");

  const rows = useMemo(() => {
    return students
      .map((student) => {
        const latestProject = student.projects[0] ?? null;
        return {
          student,
          latestProject,
          guide: getGuideLabel(latestProject)
        };
      })
      .filter(({ latestProject, guide }) => {
        if (filter === "noProject") return !latestProject;
        if (filter === "noData") return Boolean(latestProject) && !latestProject?.experimentData;
        if (filter === "analyzed") return Boolean(latestProject?.analysisResult);
        if (filter === "noReport") return Boolean(latestProject) && !latestProject?.report;
        if (filter === "highError") return (latestProject?.analysisResult?.errorRate ?? 0) >= 15;
        if (filter === "weakVariable") return guide === "변인 보완";
        if (filter === "feedbackWaiting") {
          return Boolean(latestProject?.analysisResult) && latestProject?.feedbacks.length === 0;
        }
        return true;
      });
  }, [filter, students]);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex items-center gap-2 font-bold">
            <UsersRound className="h-4 w-4 text-science" />
            학생별 진행 현황
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select className="w-48" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
              {Object.entries(filterLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">학생</th>
                <th className="px-4 py-3">학번</th>
                <th className="px-4 py-3">학교</th>
                <th className="px-4 py-3">최근 프로젝트</th>
                <th className="px-4 py-3">데이터</th>
                <th className="px-4 py-3">AI 분석</th>
                <th className="px-4 py-3">오차율</th>
                <th className="px-4 py-3">보고서</th>
                <th className="px-4 py-3">피드백</th>
                <th className="px-4 py-3">AI 지도 분류</th>
                <th className="px-4 py-3">상세</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map(({ student, latestProject, guide }) => (
                  <tr key={student.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-bold">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </td>
                    <td className="px-4 py-3">{student.gradeOrClass || "-"}</td>
                    <td className="px-4 py-3">{student.school || "-"}</td>
                    <td className="px-4 py-3">
                      {latestProject ? (
                        <>
                          <p className="font-semibold">{latestProject.title}</p>
                          <p className="text-xs text-muted-foreground">{latestProject.field}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">아직 없음</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={latestProject?.experimentData ? "success" : "muted"}>
                        {latestProject?.experimentData ? "업로드" : "대기"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {latestProject ? <StatusBadge status={latestProject.status} /> : <Badge variant="muted">대기</Badge>}
                    </td>
                    <td className="px-4 py-3">{latestProject?.analysisResult?.errorRate ?? "-"}%</td>
                    <td className="px-4 py-3">
                      <Badge variant={latestProject?.report ? "accent" : "muted"}>{latestProject?.report ? "생성" : "미생성"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={latestProject?.feedbacks.length ? "success" : "warning"}>
                        {latestProject?.feedbacks.length ? "전달됨" : "대기"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={guide === "교사 면담 권장" ? "danger" : guide === "변인 보완" ? "warning" : "science"}>
                        {guide}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {latestProject ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/projects/${latestProject.id}`}>
                            <Eye className="h-4 w-4" />
                            보기
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          프로젝트 없음
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center font-semibold text-muted-foreground" colSpan={11}>
                    조건에 맞는 학생이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function getGuideLabel(project: StudentProject | null) {
  if (!project) return "프로젝트 필요";
  if (!project.experimentData) return "데이터 입력 필요";
  if (!project.analysisResult) return "AI 분석 필요";
  if ((project.analysisResult.errorRate ?? 0) >= 15) return "교사 면담 권장";
  if (project.feedbacks.length === 0) return "피드백 대기";

  const variableText = JSON.stringify(project.analysisResult.variableAnalysis ?? {});
  if (variableText.includes("부족") || variableText.includes("통제") || variableText.includes("숨겨진")) {
    return "변인 보완";
  }

  return "진행 정상";
}
