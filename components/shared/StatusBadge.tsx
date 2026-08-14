const STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  ONLINE: { badge: "bg-full/10 text-full", dot: "bg-full", label: "ONLINE" },
  OFFLINE: { badge: "bg-offline/10 text-offline", dot: "bg-offline", label: "OFFLINE" },
  MAINTENANCE: {
    badge: "bg-maintenance/10 text-maintenance",
    dot: "bg-maintenance",
    label: "MAINTENANCE",
  },
  FULL: { badge: "bg-full/10 text-full", dot: "bg-full", label: "FULL" },
  CHARGING: { badge: "bg-charging/10 text-charging", dot: "bg-charging", label: "CHARGING" },
  EMPTY: { badge: "bg-surface-container-highest text-on-surface-variant", dot: "bg-offline", label: "EMPTY" },
  LOCKED: { badge: "bg-locked/10 text-locked", dot: "bg-locked", label: "LOCKED" },
  FAULT: { badge: "bg-fault/10 text-fault", dot: "bg-fault", label: "FAULT" },
}

export default function StatusBadge({ status }: { status: string }) {
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
