import type { Project, AnalysisResult, ExperimentData, TeacherFeedback } from "@prisma/client";

export function generateReportDraft({
  project,
  experimentData,
  analysisResult,
  feedbacks = []
}: {
  project: Project;
  experimentData?: ExperimentData | null;
  analysisResult?: AnalysisResult | null;
  feedbacks?: TeacherFeedback[];
}) {
  const rowCount = Array.isArray(experimentData?.rawData) ? experimentData.rawData.length : 0;
  const errorAnalysis = (analysisResult?.errorAnalysis ?? {}) as Record<string, unknown>;
  const variableAnalysis = (analysisResult?.variableAnalysis ?? {}) as Record<string, unknown>;
  const suggestions = (analysisResult?.researchSuggestions ?? []) as unknown[];
  const latestFeedback = feedbacks[0];

  return `# ${project.title}

## 1. 실험 목적
${project.purpose}

## 2. 가설
${project.hypothesis}

## 3. 준비물
${project.materials}

## 4. 실험 방법
${project.method}

## 5. 데이터 표
총 ${rowCount}개의 측정 데이터가 저장되었습니다. 보고서 편집 화면에서 표와 그래프를 함께 확인할 수 있습니다.

## 6. 그래프
AI 추천 그래프 유형: ${analysisResult?.chartType ?? "데이터 저장 후 추천"}

## 7. 결과 해석
${analysisResult?.interpretation ?? "AI 분석을 먼저 실행하면 결과 해석이 자동으로 작성됩니다."}

## 8. 오차 원인 분석
${Object.values(errorAnalysis).join("\n") || "오차 분석 결과가 아직 없습니다."}

## 9. 변인 분석
${Object.values(variableAnalysis).join("\n") || "변인 분석 결과가 아직 없습니다."}

## 10. 결론
${analysisResult?.hypothesisResult ?? "가설 지지 여부가 아직 분석되지 않았습니다."}

## 11. 개선점
반복 측정 횟수, 측정 위치, 통제 변인 조건을 일정하게 유지해 데이터 신뢰도를 높입니다.

## 12. 후속 연구 제안
${suggestions.map((item) => `- ${String(item)}`).join("\n") || "- 추가 데이터를 확보한 뒤 조건별 비교 실험을 진행합니다."}

## 13. 교사 피드백
${latestFeedback ? `${latestFeedback.finalComment}` : "아직 교사 피드백이 없습니다."}
`;
}
