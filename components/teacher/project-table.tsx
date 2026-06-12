"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/common/status-badge";

type TeacherProject = {
  id: string;
  title: string;
  field: string;
  status: string;
  student: {
    name: string;
    gradeOrClass: string;
  };
  experimentData: unknown | null;
  analysisResult: {
    errorRate: number | null;
    variableAnalysis: unknown;
  } | null;
  report: unknown | null;
  feedbacks: unknown[];
};

const filterLabels = {
  all: "전체",
  analyzed: "분석 완료",
  noReport: "보고서 미생성",
  highError: "오차율 높음",
  weakVariable: "변인 부족",
  feedbackWaiting: "피드백 대기"
};

export function TeacherProjectTable({ projects }: { projects: TeacherProject[] }) {
  const [filter, setFilter] = useState<keyof typeof filterLabels>("all");
  const filtered = useMemo(() => {
    return projects.filter((project) => {
      if (filter === "analyzed") return Boolean(project.analysisResult);
      if (filter === "noReport") return !project.report;
      if (filter === "highError") return (project.analysisResult?.errorRate ?? 0) >= 15;
      if (filter === "weakVariable") {
        const variableText = JSON.stringify(project.analysisResult?.variableAnalysis ?? {});
        return variableText.includes("숨겨진") || variableText.includes("통제");
      }
      if (filter === "feedbackWaiting") return project.feedbacks.length === 0 && Boolean(project.analysisResult);
      return true;
    });
  }, [filter, projects]);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex items-center gap-2 font-bold">
            <Filter className="h-4 w-4 text-science" />
            학생 프로젝트
          </div>
          <Select className="w-48" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
            {Object.entries(filterLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">학생</th>
                <th className="px-4 py-3">학번</th>
                <th className="px-4 py-3">프로젝트</th>
                <th className="px-4 py-3">분야</th>
                <th className="px-4 py-3">데이터</th>
                <th className="px-4 py-3">AI 분석</th>
                <th className="px-4 py-3">오차율</th>
                <th className="px-4 py-3">보고서</th>
                <th className="px-4 py-3">피드백</th>
                <th className="px-4 py-3">상세</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id} className="border-t border-border">
                  <td className="px-4 py-3 font-bold">{project.student.name}</td>
                  <td className="px-4 py-3">{project.student.gradeOrClass || "-"}</td>
                  <td className="px-4 py-3">{project.title}</td>
                  <td className="px-4 py-3">{project.field}</td>
                  <td className="px-4 py-3">
                    <Badge variant={project.experimentData ? "success" : "muted"}>
                      {project.experimentData ? "업로드" : "대기"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-4 py-3">{project.analysisResult?.errorRate ?? "-"}%</td>
                  <td className="px-4 py-3">
                    <Badge variant={project.report ? "accent" : "muted"}>{project.report ? "생성" : "미생성"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={project.feedbacks.length ? "success" : "warning"}>
                      {project.feedbacks.length ? "완료" : "대기"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/projects/${project.id}`}>
                        <Eye className="h-4 w-4" />
                        보기
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
