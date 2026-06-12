import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  title,
  value,
  helper,
  icon: Icon
}: {
  title: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{value}</p>
          {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#EAF0FF] text-science">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
