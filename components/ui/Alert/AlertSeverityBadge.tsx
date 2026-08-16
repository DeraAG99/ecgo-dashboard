const STYLES: Record<string, { badge: string; dot: string; label: string; icon: string }> = {
  CRITICAL: { badge: "bg-error/10 text-error", dot: "bg-error", label: "CRITICAL", icon: "error" },
  WARNING: { badge: "bg-maintenance/10 text-maintenance", dot: "bg-maintenance", label: "WARNING", icon: "warning" },
  INFO: { badge: "bg-primary/10 text-primary", dot: "bg-primary", label: "INFO", icon: "info" },
}

export default function AlertSeverityBadge({ severity }: { severity: string }) {
  const style = STYLES[severity] ?? STYLES["INFO"]!
  return (
    <span className={`status-badge ${style.badge}`}>
      <span className={`material-symbols-outlined text-[14px]`}>{style.icon}</span>
      {style.label}
    </span>
  )
}
