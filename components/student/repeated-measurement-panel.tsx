"use client";

import type { Dispatch, SetStateAction } from "react";
import { AlertTriangle, Calculator, ClipboardPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataRow } from "@/lib/chart-engine";
import { summarizeRepeatedMeasurements } from "@/lib/repeated-measurements";

type RepeatedMeasurementPanelProps = {
  rows: DataRow[];
  onRowsChange: Dispatch<SetStateAction<DataRow[]>>;
  dependentVariable: string;
  projectText: string;
  readOnly?: boolean;
};

export function RepeatedMeasurementPanel({
  rows,
  onRowsChange,
  dependentVariable,
  projectText,
  readOnly = false
}: RepeatedMeasurementPanelProps) {
  const summary = summarizeRepeatedMeasurements(rows);
  const isSudanOilExperiment = /수단\s*iii|sudan\s*iii|기름|오일|흡착/i.test(projectText);

  function applyTemplate(type: "generic" | "sudan") {
    if (!readOnly && hasData(rows) && !window.confirm("현재 입력된 표가 새 반복 측정 템플릿으로 바뀝니다. 계속할까요?")) {
      return;
    }

    onRowsChange(
      type === "sudan"
        ? [
            {
              condition: "흡착재 A",
              measurement_basis: "흡착 면적(cm²) 또는 색 농도(흡광도)",
              trial_1: "",
              trial_2: "",
              trial_3: ""
            },
            {
              condition: "흡착재 B",
              measurement_basis: "흡착 면적(cm²) 또는 색 농도(흡광도)",
              trial_1: "",
              trial_2: "",
              trial_3: ""
            },
            {
              condition: "대조군",
              measurement_basis: "흡착 면적(cm²) 또는 색 농도(흡광도)",
              trial_1: "",
              trial_2: "",
              trial_3: ""
            }
          ]
        : [
            {
              condition: "조건 A",
              measurement_basis: `${dependentVariable || "측정값"} (단위 입력)`,
              trial_1: "",
              trial_2: "",
              trial_3: ""
            },
            {
              condition: "조건 B",
              measurement_basis: `${dependentVariable || "측정값"} (단위 입력)`,
              trial_1: "",
              trial_2: "",
              trial_3: ""
            },
            {
              condition: "조건 C",
              measurement_basis: `${dependentVariable || "측정값"} (단위 입력)`,
              trial_1: "",
              trial_2: "",
              trial_3: ""
            }
          ]
    );
  }

  function addBasisColumn() {
    onRowsChange((current) =>
      (current.length ? current : [{ condition: "조건 A" }]).map((row, index) => ({
        condition: row.condition ?? row.조건 ?? `조건 ${index + 1}`,
        ...row,
        measurement_basis: row.measurement_basis ?? `${dependentVariable || "측정값"} (단위 입력)`
      }))
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-science" />
            반복 측정 통계
          </CardTitle>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            조건별 3회 이상 측정값을 입력하면 평균과 표준편차가 자동 계산됩니다.
          </p>
        </div>
        {!readOnly ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={addBasisColumn}>
              <ClipboardPlus className="h-4 w-4" />
              측정 기준 열
            </Button>
            <Button variant="science" onClick={() => applyTemplate("generic")}>
              3회 반복 템플릿
            </Button>
            {isSudanOilExperiment ? (
              <Button variant="accent" onClick={() => applyTemplate("sudan")}>
                수단 III 흡착 템플릿
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4">
        {summary.warnings.length ? (
          <div className="grid gap-2">
            {summary.warnings.map((warning) => (
              <div key={warning} className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        ) : null}

        {summary.groups.length ? (
          <div className="grid gap-4">
            {summary.groups.map((group) => (
              <div key={group.label} className="rounded-xl border border-border bg-white">
                <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
                  <p className="font-black text-primary">{group.label}</p>
                  <Badge variant={group.columns.length >= 3 ? "success" : "warning"}>{group.columns.length}회 측정</Badge>
                  <Badge variant="muted">완료 조건 {group.completeRowCount}개</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">조건</th>
                        <th className="px-3 py-2">측정 기준</th>
                        <th className="px-3 py-2">반복값</th>
                        <th className="px-3 py-2">평균</th>
                        <th className="px-3 py-2">표준편차</th>
                        <th className="px-3 py-2">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr key={row.rowIndex} className="border-t border-border">
                          <td className="px-3 py-2 font-semibold">{row.condition}</td>
                          <td className="px-3 py-2">{row.basis}</td>
                          <td className="px-3 py-2">{row.values.length ? row.values.join(", ") : "-"}</td>
                          <td className="px-3 py-2">{row.mean ?? "-"}</td>
                          <td className="px-3 py-2">{row.standardDeviation ?? "-"}</td>
                          <td className="px-3 py-2">
                            <Badge variant={row.complete ? "success" : "warning"}>{row.complete ? "3회 이상" : "보완 필요"}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-slate-50 p-5 text-sm font-semibold text-muted-foreground">
            `trial_1`, `trial_2`, `trial_3` 또는 `흡착면적_1`, `흡착면적_2`, `흡착면적_3`처럼 반복 측정 열을 만들면 통계가 표시됩니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function hasData(rows: DataRow[]) {
  return rows.some((row) => Object.values(row).some((value) => value !== null && value !== undefined && value !== ""));
}
