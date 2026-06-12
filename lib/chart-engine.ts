export type DataRow = Record<string, string | number | null>;

export type ColumnProfile = {
  name: string;
  type: "number" | "text";
  missing: number;
  outliers: number;
  min?: number;
  max?: number;
  mean?: number;
};

export type DataProfile = {
  rowCount: number;
  columns: ColumnProfile[];
  numericColumns: string[];
  textColumns: string[];
  guessedIndependent?: string;
  guessedDependent?: string;
  hasRepeatedMeasurements: boolean;
  recommendedChart: "line" | "bar" | "scatter" | "histogram";
};

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function profileData(rows: DataRow[]): DataProfile {
  const names = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  const columns: ColumnProfile[] = names.map((name) => {
    const values = rows.map((row) => row[name]);
    const nums = values.map(toNumber).filter((value): value is number => value !== null);
    const missing = values.filter((value) => value === null || value === undefined || value === "").length;
    const type: ColumnProfile["type"] =
      nums.length >= Math.max(1, values.length * 0.6) ? "number" : "text";
    const mean = nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : undefined;
    const variance =
      nums.length && mean !== undefined
        ? nums.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / nums.length
        : 0;
    const std = Math.sqrt(variance);
    const outliers =
      std > 0 && mean !== undefined ? nums.filter((value) => Math.abs(value - mean) > std * 2).length : 0;

    return {
      name,
      type,
      missing,
      outliers,
      min: nums.length ? Math.min(...nums) : undefined,
      max: nums.length ? Math.max(...nums) : undefined,
      mean
    };
  });

  const numericColumns = columns.filter((column) => column.type === "number").map((column) => column.name);
  const textColumns = columns.filter((column) => column.type === "text").map((column) => column.name);
  const guessedIndependent =
    names.find((name) => /day|time|hour|date|일|시간|차시/i.test(name)) ?? numericColumns[0] ?? textColumns[0];
  const guessedDependent =
    names.find((name) => /height|mass|rate|result|growth|길이|높이|결과|성장/i.test(name)) ??
    numericColumns.find((name) => name !== guessedIndependent) ??
    numericColumns[0];
  const hasRepeatedMeasurements =
    Boolean(guessedIndependent) &&
    new Set(rows.map((row) => String(row[guessedIndependent ?? ""]))).size < rows.length;

  return {
    rowCount: rows.length,
    columns,
    numericColumns,
    textColumns,
    guessedIndependent,
    guessedDependent,
    hasRepeatedMeasurements,
    recommendedChart: recommendChart(rows, numericColumns, textColumns, guessedIndependent)
  };
}

export function recommendChart(
  rows: DataRow[],
  numericColumns: string[],
  textColumns: string[],
  xColumn?: string
): "line" | "bar" | "scatter" | "histogram" {
  if (xColumn && /day|time|hour|date|일|시간|차시/i.test(xColumn)) return "line";
  if (textColumns.length && numericColumns.length) return "bar";
  if (numericColumns.length >= 2 && rows.length > 3) return "scatter";
  return "histogram";
}

export function histogramRows(rows: DataRow[], yColumn: string) {
  const values = rows.map((row) => toNumber(row[yColumn])).filter((value): value is number => value !== null);
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const bucketCount = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(values.length))));
  const width = (max - min || 1) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    range: `${(min + width * index).toFixed(1)}-${(min + width * (index + 1)).toFixed(1)}`,
    count: 0
  }));
  values.forEach((value) => {
    const index = Math.min(bucketCount - 1, Math.floor((value - min) / width));
    buckets[index].count += 1;
  });
  return buckets;
}
