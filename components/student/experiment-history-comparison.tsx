"use client";

import Link from "next/link";
import { Activity, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ExperimentComparisonItem = {
  id: string;
  title: string;
  field: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  analysisResult: {
    errorRate: number | null;
  } | null;
};

export function ExperimentHistoryComparison({
  currentProject,
  previousProjects
}: {
  currentProject: ExperimentComparisonItem;
  previousProjects: ExperimentComparisonItem[];
}) {
  const items = [...previousProjects, currentProject]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((project, index) => {
      const errorRate = project.analysisResult?.errorRate;
      const successRate = typeof errorRate === "number" ? Math.max(0, Math.min(100, Number((100 - errorRate).toFixed(1)))) : null;
      return {
        ...project,
        index: index + 1,
        label: `${index + 1}차`,
        errorRate,
        successRate
      };
    });

  const current = items.find((item) => item.id === currentProject.id) ?? items[items.length - 1];
  const previousAnalyzed = [...items]
    .reverse()
    .find((item) => item.id !== currentProject.id && typeof item.errorRate === "number");
  const analyzedItems = items.filter((item) => typeof item.errorRate === "number");
  const successDelta =
    current?.successRate !== null && current?.successRate !== undefined && previousAnalyzed?.successRate !== null && previousAnalyzed?.successRate !== undefined
      ? Number((current.successRate - previousAnalyzed.successRate).toFixed(1))
      : null;
  const averageSuccess = analyzedItems.length
    ? Number((analyzedItems.reduce((sum, item) => sum + (item.successRate ?? 0), 0) / analyzedItems.length).toFixed(1))
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-science" />
          이전 실험 비교
        </CardTitle>
        <p className="text-sm font-semibold text-muted-foreground">
          같은 학생의 실험별 오차율과 실험 성공률(추정)을 비교합니다.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Metric title="현재 오차율" value={formatPercent(current?.errorRate)} />
          <Metric title="현재 성공률(추정)" value={formatPercent(current?.successRate)} />
          <div className="rounded-xl bg-[#F3F6FB] p-4">
            <p className="text-xs font-bold text-muted-foreground">이전 대비 변화</p>
            <div className="mt-2 flex items-center gap-2">
              {successDelta === null ? (
                <Minus className="h-5 w-5 text-slate-500" />
              ) : successDelta >= 0 ? (
                <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              )}
              <p className="font-black text-primary">{successDelta === null ? "비교 전" : `${successDelta > 0 ? "+" : ""}${successDelta}%p`}</p>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              평균 성공률 {formatPercent(averageSuccess)}
            </p>
          </div>
        </div>

        {analyzedItems.length >= 2 ? (
          <div className="h-72 rounded-xl border border-border bg-white p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={items}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="successRate" name="성공률(추정)" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="errorRate" name="오차율" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-slate-50 p-5 text-sm font-semibold text-muted-foreground">
            AI 분석이 완료된 실험이 2개 이상이면 성공률과 오차율 변화 추이가 그래프로 표시됩니다.
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">순서</th>
                <th className="px-3 py-2">실험</th>
                <th className="px-3 py-2">분야</th>
                <th className="px-3 py-2">오차율</th>
                <th className="px-3 py-2">성공률(추정)</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">보기</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2">{item.label}</td>
                  <td className="px-3 py-2 font-semibold">{item.title}</td>
                  <td className="px-3 py-2">{item.field}</td>
                  <td className="px-3 py-2">{formatPercent(item.errorRate)}</td>
                  <td className="px-3 py-2">{formatPercent(item.successRate)}</td>
                  <td className="px-3 py-2">
                    <Badge variant={item.id === currentProject.id ? "science" : "muted"}>
                      {item.id === currentProject.id ? "현재 실험" : "이전 실험"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/projects/${item.id}`}>열기</Link>
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

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F3F6FB] p-4">
      <p className="text-xs font-bold text-muted-foreground">{title}</p>
      <p className="mt-2 font-black text-primary">{value}</p>
    </div>
  );
}

function formatPercent(value: number | null | undefined) {
  return typeof value === "number" ? `${value}%` : "-";
}
