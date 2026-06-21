import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS, type RequisitionStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const styles: Record<RequisitionStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 border-transparent",
  PICKING: "bg-primary/15 text-primary border-transparent",
  COMPLETED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent",
}

export function StatusBadge({ status }: { status: RequisitionStatus }) {
  return (
    <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
