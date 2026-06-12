import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLockup({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white p-1 shadow-sm">
        <Image src="/school-logo.png" alt="학교 로고" fill className="object-contain p-1" priority />
      </div>
      <div className="min-w-0">
        <div className={cn("font-extrabold leading-tight", compact ? "text-base" : "text-xl")}>
          LabInsight AI
        </div>
        <div className={cn("truncate leading-tight", compact ? "text-xs" : "text-sm")}>
          전남과학고 실험 데이터 분석 플랫폼
        </div>
      </div>
    </div>
  );
}
