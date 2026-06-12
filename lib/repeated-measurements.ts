import type { DataRow } from "@/lib/chart-engine";

export type RepeatRowStat = {
  rowIndex: number;
  condition: string;
  basis: string;
  values: number[];
  mean: number | null;
  standardDeviation: number | null;
  complete: boolean;
};

export type RepeatMeasurementGroup = {
  label: string;
  columns: string[];
  rows: RepeatRowStat[];
  completeRowCount: number;
  incompleteRowCount: number;
};

export type RepeatedMeasurementSummary = {
  hasRepeatedMeasurements: boolean;
  groups: RepeatMeasurementGroup[];
  measurementBasisColumns: string[];
  numericColumnsNeedingBasis: string[];
  warnings: string[];
};

const basisColumnPattern = /basis|unit|criterion|criteria|measurement_basis|단위|기준|측정기준|측정_기준/i;
const unitOrMeaningPattern =
  /cm|mm|m2|m²|cm2|cm²|%|mol|g|kg|ml|mL|L|abs|흡광|흡착|농도|면적|질량|길이|높이|부피|온도|시간|조도|습도|색|기름|오일|area|mass|height|volume|temperature|humidity|intensity|concentration|absorbance/i;
const genericNumericPattern = /^(value|값|측정값|measurement|result|결과|trial[_ -]?\d+|rep[_ -]?\d+|repeat[_ -]?\d+)$/i;

export function summarizeRepeatedMeasurements(rows: DataRow[]): RepeatedMeasurementSummary {
  const columns = getColumns(rows);
  const numericColumns = columns.filter((column) => isNumericColumn(rows, column));
  const measurementBasisColumns = columns.filter((column) => basisColumnPattern.test(column));
  const groups = buildRepeatGroups(rows, numericColumns, measurementBasisColumns);
  const repeatedColumns = new Set(groups.flatMap((group) => group.columns));
  const numericColumnsNeedingBasis =
    measurementBasisColumns.length > 0
      ? []
      : numericColumns.filter((column) => !repeatedColumns.has(column) && needsBasis(column));

  const warnings: string[] = [];
  groups.forEach((group) => {
    if (group.columns.length < 3) {
      warnings.push(`${group.label}은 반복 측정 열이 ${group.columns.length}개입니다. 신뢰도 비교를 위해 3회 이상 입력하세요.`);
    }
    if (group.incompleteRowCount > 0) {
      warnings.push(`${group.label}에서 ${group.incompleteRowCount}개 조건은 유효한 측정값이 3개 미만입니다.`);
    }
  });
  if (!groups.length) {
    warnings.push("조건별 3회 이상 반복 측정값을 입력하면 평균과 표준편차를 자동 계산합니다.");
  }
  if (numericColumnsNeedingBasis.length > 0) {
    warnings.push(
      `${numericColumnsNeedingBasis.join(", ")} 컬럼은 숫자의 의미가 모호합니다. 흡착 면적(cm²), 색 농도, 흡광도처럼 측정 기준과 단위를 명시하세요.`
    );
  }

  return {
    hasRepeatedMeasurements: groups.some((group) => group.columns.length >= 3),
    groups,
    measurementBasisColumns,
    numericColumnsNeedingBasis,
    warnings
  };
}

function buildRepeatGroups(rows: DataRow[], numericColumns: string[], basisColumns: string[]) {
  const grouped = new Map<string, string[]>();
  numericColumns.forEach((column) => {
    const label = getRepeatGroupLabel(column);
    if (!label) return;
    const columns = grouped.get(label) ?? [];
    columns.push(column);
    grouped.set(label, columns);
  });

  return Array.from(grouped.entries())
    .filter(([, columns]) => columns.length >= 2)
    .map(([label, columns]) => {
      const orderedColumns = [...columns].sort(compareRepeatColumns);
      const rowStats = rows.map((row, rowIndex) => {
        const values = orderedColumns
          .map((column) => toNumber(row[column]))
          .filter((value): value is number => value !== null);
        const mean = values.length ? average(values) : null;
        const standardDeviation = values.length >= 2 ? sampleStandardDeviation(values, mean ?? 0) : null;
        return {
          rowIndex,
          condition: getConditionLabel(row, rowIndex),
          basis: getBasisLabel(row, basisColumns),
          values,
          mean: mean === null ? null : round(mean),
          standardDeviation: standardDeviation === null ? null : round(standardDeviation),
          complete: values.length >= 3
        };
      });

      return {
        label,
        columns: orderedColumns,
        rows: rowStats,
        completeRowCount: rowStats.filter((row) => row.complete).length,
        incompleteRowCount: rowStats.filter((row) => !row.complete).length
      };
    });
}

function getRepeatGroupLabel(column: string) {
  const normalized = column.trim();
  const simpleTrial = normalized.match(/^(trial|rep|repeat|measurement|measure|측정|반복)[ _-]?(\d+)$/i);
  if (simpleTrial) return "측정값";

  const delimited = normalized.match(/^(.+?)[ _-](\d+)$/);
  if (delimited) return delimited[1].trim();

  const koreanSuffix = normalized.match(/^(.+[\u3131-\uD79D])(\d+)$/);
  if (koreanSuffix) return koreanSuffix[1].trim();

  return null;
}

function compareRepeatColumns(a: string, b: string) {
  return getTrailingNumber(a) - getTrailingNumber(b);
}

function getTrailingNumber(column: string) {
  return Number(column.match(/(\d+)$/)?.[1] ?? 0);
}

function getColumns(rows: DataRow[]) {
  return Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );
}

function isNumericColumn(rows: DataRow[], column: string) {
  const values = rows.map((row) => row[column]).filter((value) => value !== null && value !== undefined && value !== "");
  if (!values.length) return false;
  const numericCount = values.filter((value) => toNumber(value) !== null).length;
  return numericCount >= Math.max(1, values.length * 0.6);
}

function needsBasis(column: string) {
  return genericNumericPattern.test(column) || !unitOrMeaningPattern.test(column);
}

function getConditionLabel(row: DataRow, rowIndex: number) {
  const condition =
    row.condition ??
    row.조건 ??
    row.group ??
    row.sample ??
    row.시료 ??
    row.material ??
    row.흡착재 ??
    row.처리조건;
  return String(condition ?? `조건 ${rowIndex + 1}`);
}

function getBasisLabel(row: DataRow, basisColumns: string[]) {
  for (const column of basisColumns) {
    const value = row[column];
    if (value !== null && value !== undefined && value !== "") return String(value);
  }
  return "-";
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleStandardDeviation(values: number[], mean: number) {
  if (values.length < 2) return null;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function round(value: number) {
  return Number(value.toFixed(3));
}
