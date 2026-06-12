"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type School = {
  name: string;
  address: string;
  officeName: string;
  officeCode: string;
  schoolCode: string;
  type: string;
  source?: "NEIS" | "LOCAL" | "DIRECT";
};

export function SchoolSearch({
  value,
  onChange
}: {
  value: string;
  onChange: (school: School) => void;
}) {
  const [query, setQuery] = useState(value);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      if (query.trim().length < 2) {
        setSchools([]);
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/neis/schools?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json().catch(() => ({ schools: [] }));
      setSchools(data.schools ?? []);
      setLoading(false);
    }, 250);

    return () => window.clearTimeout(handle);
  }, [query]);

  return (
    <div className="grid gap-2 sm:col-span-2">
      <Label htmlFor="schoolSearch">학교 검색</Label>
      <input type="hidden" name="school" value={value} />
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="schoolSearch"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-9"
          placeholder="학교명 검색"
          autoComplete="off"
        />
      </div>
      <div className="min-h-10 rounded-lg border border-border bg-slate-50 p-2">
        {loading ? (
          <p className="px-2 py-1 text-sm font-semibold text-muted-foreground">학교 검색 중...</p>
        ) : schools.length ? (
          <div className="grid gap-2">
            {schools.map((school) => (
              <Button
                key={`${school.officeCode}-${school.schoolCode}-${school.name}`}
                type="button"
                variant={school.name === value ? "accent" : "outline"}
                className="h-auto justify-start whitespace-normal px-3 py-2 text-left"
                onClick={() => {
                  onChange(school);
                  setQuery(school.name);
                }}
              >
                <span>
                  <span className="block font-bold">{school.name}</span>
                  <span className="block text-xs font-medium text-muted-foreground">
                    {school.officeName} · {school.type} · {school.address || "주소 정보 없음"}
                    {school.source === "DIRECT" ? " · 직접 입력" : ""}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <p className="px-2 py-1 text-sm font-semibold text-muted-foreground">
            학교명을 2글자 이상 입력하고 검색 결과를 선택하세요. 결과가 없으면 직접 입력 후보가 표시됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
