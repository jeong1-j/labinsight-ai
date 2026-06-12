"use client";

import { useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { histogramRows, profileData, type DataRow } from "@/lib/chart-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const chartLabels = {
  line: "Line Chart",
  bar: "Bar Chart",
  scatter: "Scatter Plot",
  histogram: "Histogram"
};

export function ExperimentChart({
  rows,
  initialChartType
}: {
  rows: DataRow[];
  initialChartType?: "line" | "bar" | "scatter" | "histogram" | string;
}) {
  const profile = useMemo(() => profileData(rows), [rows]);
  const [chartType, setChartType] = useState<"line" | "bar" | "scatter" | "histogram">(
    normalizeChart(initialChartType) ?? profile.recommendedChart
  );
  const [xColumn, setXColumn] = useState(profile.guessedIndependent ?? Object.keys(rows[0] ?? {})[0] ?? "");
  const [yColumn, setYColumn] = useState(profile.guessedDependent ?? profile.numericColumns[0] ?? "");
  const chartRef = useRef<HTMLDivElement>(null);

  const histogramData = useMemo(() => histogramRows(rows, yColumn), [rows, yColumn]);

  async function downloadChart() {
    if (!chartRef.current) return;
    const dataUrl = await toPng(chartRef.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `labinsight-${chartType}.png`;
    link.click();
  }

  if (!rows.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>그래프 자동 생성</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="science">AI 추천: {chartLabels[profile.recommendedChart]}</Badge>
            <Badge variant="muted">행 {profile.rowCount}개</Badge>
          </div>
        </div>
        <Button variant="outline" onClick={downloadChart}>
          <Download className="h-4 w-4" />
          이미지 다운로드
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>그래프 유형</Label>
            <Select value={chartType} onChange={(event) => setChartType(event.target.value as typeof chartType)}>
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="scatter">Scatter Plot</option>
              <option value="histogram">Histogram</option>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>x축</Label>
            <Select value={xColumn} onChange={(event) => setXColumn(event.target.value)}>
              {Object.keys(rows[0] ?? {}).map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>y축</Label>
            <Select value={yColumn} onChange={(event) => setYColumn(event.target.value)}>
              {profile.numericColumns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div ref={chartRef} className="mt-5 h-[360px] w-full rounded-xl border border-border bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xColumn} />
                <YAxis />
                <Tooltip />
                <Bar dataKey={yColumn} fill="#1F4FCB" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : chartType === "scatter" ? (
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xColumn} name={xColumn} type="number" />
                <YAxis dataKey={yColumn} name={yColumn} type="number" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={rows} fill="#001A70" />
              </ScatterChart>
            ) : chartType === "histogram" ? (
              <BarChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#F7E600" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xColumn} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey={yColumn} stroke="#1F4FCB" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function normalizeChart(value?: string) {
  if (value === "line" || value === "bar" || value === "scatter" || value === "histogram") {
    return value;
  }
  return undefined;
}
