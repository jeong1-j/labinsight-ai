import OpenAI from "openai";
import { profileData, type DataRow } from "@/lib/chart-engine";
import { summarizeRepeatedMeasurements } from "@/lib/repeated-measurements";

export type ExperimentAnalysisInput = {
  title: string;
  purpose: string;
  hypothesis: string;
  independentVariable: string;
  dependentVariable: string;
  controlledVariables: string;
  field: string;
  theoryValue?: string | null;
  data: DataRow[];
};

export type ExperimentAnalysisOutput = {
  chartType: "line" | "bar" | "scatter" | "histogram";
  summaryStats: Record<string, unknown>;
  interpretation: string;
  hypothesisResult: string;
  errorRate: number | null;
  errorAnalysis: Record<string, string>;
  variableAnalysis: Record<string, string>;
  researchSuggestions: string[];
  reportDraft: string;
};

export async function analyzeExperiment(input: ExperimentAnalysisInput): Promise<ExperimentAnalysisOutput> {
  if (process.env.OPENAI_API_KEY) {
    try {
      return await analyzeWithOpenAI(input);
    } catch (error) {
      console.error("OpenAI analysis failed, using mock analysis", error);
    }
  }

  return mockAnalysis(input);
}

async function analyzeWithOpenAI(input: ExperimentAnalysisInput): Promise<ExperimentAnalysisOutput> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const profile = profileData(input.data);
  const repeatedMeasurements = summarizeRepeatedMeasurements(input.data);

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You are a Korean science teacher and data analyst. Return valid JSON only. The JSON must include chartType, summaryStats, interpretation, hypothesisResult, errorRate, errorAnalysis, variableAnalysis, researchSuggestions, reportDraft."
      },
      {
        role: "user",
        content: JSON.stringify({
          experiment: input,
          dataProfile: profile,
          repeatedMeasurements,
          requiredErrorCategories: [
            "측정 오차",
            "장비 오차",
            "환경 오차",
            "실험자 오차",
            "기록 오류",
            "표본 수 부족",
            "통제 변인 부족"
          ]
        })
      }
    ]
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as Partial<ExperimentAnalysisOutput>;

  return {
    chartType: parsed.chartType ?? profile.recommendedChart,
    summaryStats: parsed.summaryStats ?? { ...profile, repeatedMeasurements },
    interpretation: parsed.interpretation ?? "데이터 경향을 분석했습니다.",
    hypothesisResult: parsed.hypothesisResult ?? "가설은 부분적으로 지지됩니다.",
    errorRate: typeof parsed.errorRate === "number" ? parsed.errorRate : estimateErrorRate(input),
    errorAnalysis: parsed.errorAnalysis ?? buildErrorAnalysis(input, profile),
    variableAnalysis: parsed.variableAnalysis ?? buildVariableAnalysis(input, profile),
    researchSuggestions: parsed.researchSuggestions ?? buildSuggestions(input),
    reportDraft: parsed.reportDraft ?? buildReportDraft(input, profile)
  };
}

function mockAnalysis(input: ExperimentAnalysisInput): ExperimentAnalysisOutput {
  const profile = profileData(input.data);
  const repeatedMeasurements = summarizeRepeatedMeasurements(input.data);
  const errorRate = estimateErrorRate(input);
  const trend = describeTrend(input, profile.guessedIndependent, profile.guessedDependent);

  return {
    chartType: profile.recommendedChart,
    summaryStats: {
      rowCount: profile.rowCount,
      numericColumns: profile.numericColumns,
      textColumns: profile.textColumns,
      columns: profile.columns,
      missingValueColumns: profile.columns.filter((column) => column.missing > 0),
      outlierColumns: profile.columns.filter((column) => column.outliers > 0),
      guessedIndependent: profile.guessedIndependent,
      guessedDependent: profile.guessedDependent,
      hasRepeatedMeasurements: profile.hasRepeatedMeasurements,
      repeatedMeasurements
    },
    interpretation: `${input.title} 데이터에서는 ${trend} ${input.independentVariable}와 ${input.dependentVariable}의 관계를 그래프로 확인하면 경향이 더 명확해집니다.`,
    hypothesisResult:
      trend.includes("증가")
        ? `측정값이 전반적으로 증가하므로 "${input.hypothesis}" 가설은 현재 데이터에서 대체로 지지됩니다.`
        : `현재 데이터만으로는 "${input.hypothesis}" 가설을 완전히 지지하기 어렵고 추가 반복 측정이 필요합니다.`,
    errorRate,
    errorAnalysis: buildErrorAnalysis(input, profile),
    variableAnalysis: buildVariableAnalysis(input, profile),
    researchSuggestions: buildSuggestions(input),
    reportDraft: buildReportDraft(input, profile)
  };
}

function estimateErrorRate(input: ExperimentAnalysisInput) {
  const theory = Number(String(input.theoryValue ?? "").replace(/[^0-9.-]/g, ""));
  const profile = profileData(input.data);
  const yColumn = profile.guessedDependent;
  if (!Number.isFinite(theory) || !yColumn || theory === 0) {
    const outliers = profile.columns.reduce((sum, column) => sum + column.outliers, 0);
    const missing = profile.columns.reduce((sum, column) => sum + column.missing, 0);
    return Math.min(35, Number(((outliers + missing) * 2.5 + 5).toFixed(1)));
  }

  const values = input.data
    .map((row) => Number(row[yColumn]))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return null;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Number((Math.abs(avg - theory) / Math.abs(theory) * 100).toFixed(1));
}

function buildErrorAnalysis(input: ExperimentAnalysisInput, profile = profileData(input.data)) {
  const missingColumns = profile.columns.filter((column) => column.missing > 0).map((column) => column.name);
  const outlierColumns = profile.columns.filter((column) => column.outliers > 0).map((column) => column.name);
  return {
    "측정 오차": `${input.dependentVariable} 측정 위치나 눈금 읽기 방식이 일정하지 않으면 결과가 달라질 수 있습니다.`,
    "장비 오차": "센서 반응 속도, 기기 보정 상태, 측정 범위 제한이 오차율을 높일 수 있습니다.",
    "환경 오차": `${input.controlledVariables || "온도, 습도, 조도"} 조건이 완전히 일정하지 않으면 실험 결과에 영향을 줍니다.`,
    "실험자 오차": "측정 시간과 시료 처리 순서를 표준화하지 않으면 반복 측정 간 차이가 커질 수 있습니다.",
    "기록 오류": missingColumns.length
      ? `${missingColumns.join(", ")} 컬럼에 결측값이 있어 기록 확인이 필요합니다.`
      : "기록 형식은 대체로 안정적이지만 단위와 소수점 자리수를 통일하는 것이 좋습니다.",
    "표본 수 부족": profile.rowCount < 10
      ? `현재 ${profile.rowCount}개 행으로는 일반화에 제한이 있으므로 반복 측정 수를 늘리는 것이 좋습니다.`
      : "표본 수는 기본 경향을 파악하기에 충분하지만 조건별 반복 수를 더 확보하면 신뢰도가 올라갑니다.",
    "통제 변인 부족": outlierColumns.length
      ? `${outlierColumns.join(", ")} 컬럼에서 이상값이 감지되어 통제 변인을 다시 점검해야 합니다.`
      : "통제 변인은 기록되어 있으나 실제 유지 여부를 실험 과정에서 함께 확인해야 합니다."
  };
}

function buildVariableAnalysis(input: ExperimentAnalysisInput, profile = profileData(input.data)) {
  return {
    independent: `독립변인은 ${input.independentVariable}로 설정되어 있으며, 데이터상 추정 x축은 ${profile.guessedIndependent ?? "미확인"}입니다.`,
    dependent: `종속변인은 ${input.dependentVariable}로 설정되어 있으며, 데이터상 추정 y축은 ${profile.guessedDependent ?? "미확인"}입니다.`,
    controlled: `${input.controlledVariables || "통제 변인"} 조건을 측정 표에 함께 기록하면 숨겨진 변인의 영향을 더 쉽게 분리할 수 있습니다.`,
    hidden:
      "데이터에 직접 기록되지 않은 측정 시간, 장비 보정 상태, 주변 환경 변화가 숨겨진 변인으로 작용했을 가능성이 있습니다."
  };
}

function buildSuggestions(input: ExperimentAnalysisInput) {
  return [
    `${input.independentVariable} 범위를 더 촘촘하게 나누어 측정합니다.`,
    `${input.controlledVariables || "통제 변인"}을 표준화하고 실험 기록지에 함께 남깁니다.`,
    "조건별 반복 측정을 3회 이상 수행해 평균과 표준편차를 비교합니다.",
    "후속 연구에서는 다른 실험 분야의 관련 변인을 추가해 융합적으로 해석합니다."
  ];
}

function describeTrend(input: ExperimentAnalysisInput, xColumn?: string, yColumn?: string) {
  if (!xColumn || !yColumn) return "뚜렷한 수치 경향은 아직 제한적으로 나타납니다.";
  const points = input.data
    .map((row) => ({ x: Number(row[xColumn]), y: Number(row[yColumn]) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => a.x - b.x);
  if (points.length < 2) return "자료 수가 부족해 경향 판단이 제한됩니다.";
  const first = points[0].y;
  const last = points[points.length - 1].y;
  if (last > first) return `${yColumn} 값이 전반적으로 증가하는 경향이 관찰됩니다.`;
  if (last < first) return `${yColumn} 값이 전반적으로 감소하는 경향이 관찰됩니다.`;
  return `${yColumn} 값이 큰 변화 없이 유지되는 경향이 관찰됩니다.`;
}

function buildReportDraft(input: ExperimentAnalysisInput, profile = profileData(input.data)) {
  const repeatedMeasurements = summarizeRepeatedMeasurements(input.data);
  const interpretation = `${input.independentVariable} 변화에 따른 ${input.dependentVariable} 변화를 ${profile.recommendedChart} 그래프로 표현하면 결과 경향을 확인할 수 있습니다.`;
  const repeatedText = repeatedMeasurements.groups.length
    ? repeatedMeasurements.groups
        .map((group) => {
          const rows = group.rows
            .map((row) => `${row.condition}: 평균 ${row.mean ?? "-"}, 표준편차 ${row.standardDeviation ?? "-"}`)
            .join("; ");
          return `${group.label} 반복 측정 결과 - ${rows}`;
        })
        .join("\n")
    : "조건별 3회 이상 반복 측정을 추가하면 평균과 표준편차를 비교할 수 있습니다.";
  return `# ${input.title}

## 실험 목적
${input.purpose}

## 가설
${input.hypothesis}

## 결과 해석
${interpretation}

## 반복 측정 통계
${repeatedText}

## 오차 원인 분석
오차율이 높은 원인으로는 측정 위치 차이, 센서 반응 속도, 주변 환경 변화가 있을 수 있습니다. 개선 방법으로는 반복 측정 횟수를 늘리고 측정 시간과 측정 위치를 일정하게 유지하는 것이 필요합니다.

## 결론
현재 데이터는 가설을 검토하기 위한 기본 근거를 제공하며, 추가 반복 측정과 통제 변인 기록을 통해 더 신뢰도 높은 결론을 도출할 수 있습니다.`;
}
