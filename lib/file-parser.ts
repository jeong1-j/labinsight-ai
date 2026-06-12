"use client";

import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { DataRow } from "@/lib/chart-engine";

export async function parseExperimentFile(file: File): Promise<DataRow[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") {
    return parseCsv(await file.text());
  }

  if (extension === "xlsx" || extension === "xls") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<DataRow>(firstSheet, { defval: null });
  }

  throw new Error("CSV 또는 Excel 파일만 업로드할 수 있습니다.");
}

export function parseCsv(text: string): DataRow[] {
  const result = Papa.parse<DataRow>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true
  });

  if (result.errors.length) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

export function rowsToCsv(rows: DataRow[]) {
  return Papa.unparse(rows);
}
