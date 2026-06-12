"use client";

import { useMemo, useRef } from "react";
import type { Dispatch, KeyboardEvent, SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DataRow } from "@/lib/chart-engine";

type SpreadsheetDataGridProps = {
  rows: DataRow[];
  onRowsChange: Dispatch<SetStateAction<DataRow[]>>;
  readOnly?: boolean;
};

export function SpreadsheetDataGrid({ rows, onRowsChange, readOnly = false }: SpreadsheetDataGridProps) {
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const columns = useMemo(() => getColumns(rows), [rows]);

  function focusCell(rowIndex: number, columnIndex: number) {
    window.setTimeout(() => {
      cellRefs.current[`${rowIndex}:${columnIndex}`]?.focus();
      cellRefs.current[`${rowIndex}:${columnIndex}`]?.select();
    }, 0);
  }

  function updateCell(rowIndex: number, column: string, value: string) {
    onRowsChange((current) =>
      ensureRows(current).map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              [column]: value
            }
          : row
      )
    );
  }

  function addRow() {
    onRowsChange((current) => [...ensureRows(current), Object.fromEntries(columns.map((column) => [column, ""]))]);
  }

  function removeRow(index: number) {
    onRowsChange((current) => {
      const next = ensureRows(current).filter((_, rowIndex) => rowIndex !== index);
      return next.length ? next : [Object.fromEntries(columns.map((column) => [column, ""]))];
    });
  }

  function addColumn() {
    onRowsChange((current) => {
      const currentColumns = getColumns(current);
      const columnName = nextColumnName(currentColumns);
      return ensureRows(current).map((row) => ({ ...row, [columnName]: "" }));
    });
  }

  function removeColumn(column: string) {
    if (columns.length <= 1) return;
    onRowsChange((current) =>
      ensureRows(current).map((row) =>
        Object.fromEntries(Object.entries(row).filter(([key]) => key !== column))
      )
    );
  }

  function renameColumn(oldName: string, rawName: string) {
    const newName = rawName.trim();
    if (!newName || newName === oldName || columns.includes(newName)) return;
    onRowsChange((current) =>
      ensureRows(current).map((row) =>
        Object.fromEntries(
          columns.map((column) => {
            const key = column === oldName ? newName : column;
            return [key, row[column] ?? ""];
          })
        )
      )
    );
  }

  function pasteMatrix(startRow: number, startColumn: number, text: string) {
    const matrix = parsePastedMatrix(text);
    if (!matrix.length) return;

    onRowsChange((current) => {
      const nextColumns = [...getColumns(current)];
      const neededColumnCount = startColumn + Math.max(...matrix.map((row) => row.length));
      while (nextColumns.length < neededColumnCount) {
        nextColumns.push(nextColumnName(nextColumns));
      }

      const nextRows = ensureRows(current).map((row) =>
        Object.fromEntries(nextColumns.map((column) => [column, row[column] ?? ""]))
      );
      while (nextRows.length < startRow + matrix.length) {
        nextRows.push(Object.fromEntries(nextColumns.map((column) => [column, ""])));
      }

      matrix.forEach((line, rowOffset) => {
        line.forEach((value, columnOffset) => {
          nextRows[startRow + rowOffset][nextColumns[startColumn + columnOffset]] = value;
        });
      });

      return nextRows;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>, rowIndex: number, columnIndex: number) {
    if (event.key === "Enter" || event.key === "ArrowDown") {
      event.preventDefault();
      if (rowIndex === rows.length - 1) addRow();
      focusCell(rowIndex + 1, columnIndex);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusCell(Math.max(0, rowIndex - 1), columnIndex);
      return;
    }
    if (event.key === "ArrowLeft" && event.currentTarget.selectionStart === 0) {
      event.preventDefault();
      focusCell(rowIndex, Math.max(0, columnIndex - 1));
      return;
    }
    if (event.key === "ArrowRight" && event.currentTarget.selectionStart === event.currentTarget.value.length) {
      event.preventDefault();
      focusCell(rowIndex, Math.min(columns.length - 1, columnIndex + 1));
    }
  }

  const visibleRows = ensureRows(rows);

  return (
    <div className="grid gap-3">
      {!readOnly ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={addColumn}>
            <Plus className="h-4 w-4" />
            열 추가
          </Button>
          <Button variant="outline" onClick={addRow}>
            <Plus className="h-4 w-4" />행 추가
          </Button>
        </div>
      ) : null}

      <div className="overflow-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="sticky left-0 z-20 w-14 border-b border-r border-border bg-slate-100 px-2 py-2 text-center text-xs font-black text-slate-500">
                #
              </th>
              {columns.map((column) => (
                <th key={column} className="min-w-36 border-b border-r border-border px-2 py-2">
                  {readOnly ? (
                    <span className="block text-left font-black text-slate-700">{column}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        defaultValue={column}
                        aria-label={`${column} 열 이름`}
                        className="h-8 border-transparent bg-white font-bold focus-visible:border-science"
                        onBlur={(event) => renameColumn(column, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeColumn(column)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </th>
              ))}
              {!readOnly ? (
                <th className="w-14 border-b border-border bg-slate-100 px-2 py-2 text-center text-xs font-black text-slate-500">
                  삭제
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-border">
                <td className="sticky left-0 z-10 border-r border-border bg-slate-50 px-2 py-1 text-center text-xs font-bold text-slate-500">
                  {rowIndex + 1}
                </td>
                {columns.map((column, columnIndex) => (
                  <td key={column} className="border-r border-border p-0">
                    {readOnly ? (
                      <span className="block min-h-10 px-3 py-2">{formatCell(row[column])}</span>
                    ) : (
                      <input
                        ref={(node) => {
                          cellRefs.current[`${rowIndex}:${columnIndex}`] = node;
                        }}
                        value={String(row[column] ?? "")}
                        className="h-10 w-full border-0 bg-white px-3 text-sm outline-none ring-inset focus:bg-blue-50 focus:ring-2 focus:ring-science"
                        onChange={(event) => updateCell(rowIndex, column, event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event, rowIndex, columnIndex)}
                        onPaste={(event) => {
                          const text = event.clipboardData.getData("text");
                          if (text.includes("\t") || text.includes("\n")) {
                            event.preventDefault();
                            pasteMatrix(rowIndex, columnIndex, text);
                          }
                        }}
                      />
                    )}
                  </td>
                ))}
                {!readOnly ? (
                  <td className="w-14 p-1 text-center">
                    <Button type="button" variant="outline" size="icon" onClick={() => removeRow(rowIndex)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly ? (
        <p className="text-xs font-semibold text-muted-foreground">
          엑셀이나 구글 스프레드시트에서 복사한 표를 셀에 그대로 붙여넣을 수 있습니다.
        </p>
      ) : null}
    </div>
  );
}

function ensureRows(rows: DataRow[]) {
  return rows.length ? rows : [{ day: "", value: "" }];
}

function getColumns(rows: DataRow[]) {
  const names = Array.from(
    ensureRows(rows).reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );
  return names.length ? names : ["day", "value"];
}

function nextColumnName(columns: string[]) {
  let index = columns.length + 1;
  let name = `column_${index}`;
  while (columns.includes(name)) {
    index += 1;
    name = `column_${index}`;
  }
  return name;
}

function parsePastedMatrix(text: string) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .filter((line, index, lines) => line.length > 0 || index < lines.length - 1)
    .map((line) => line.split("\t").map((cell) => cell.trim()));
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}
