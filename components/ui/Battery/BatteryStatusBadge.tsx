const STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  AVAILABLE: { badge: "bg-full/10 text-full", dot: "bg-full", label: "AVAILABLE" },
  IN_USE: { badge: "bg-charging/10 text-charging", dot: "bg-charging", label: "IN_USE" },
  CHARGING: { badge: "bg-primary/10 text-primary", dot: "bg-primary", label: "CHARGING" },
  FAULT: { badge: "bg-fault/10 text-fault", dot: "bg-fault", label: "FAULT" },
  RETIRED: { badge: "bg-locked/10 text-locked", dot: "bg-locked", label: "RETIRED" },
}

export default function BatteryStatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? {
    badge: "bg-surface-container text-on-surface-variant",
    dot: "bg-on-surface-variant",
    label: status,
  }
  return (
    <span className={`status-badge ${style.badge}`}>
      <span className={`status-dot ${style.dot}`}></span>
      {style.label}
    </span>
  )
}
