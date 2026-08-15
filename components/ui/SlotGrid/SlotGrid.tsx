import type { Slot } from "@/lib/schema"

interface SlotGridProps {
  slots: Slot[]
  stale?: boolean
}

const SLOT_STYLES: Record<string, { border: string; text: string; badge: string; pulse?: boolean }> = {
  FULL: { border: "border-t-ecgo-green", text: "text-ecgo-green", badge: "bg-ecgo-green/10 text-ecgo-green" },
  CHARGING: { border: "border-t-charging", text: "text-charging", badge: "bg-charging/10 text-charging", pulse: true },
  EMPTY: { border: "", text: "text-on-surface-variant/50", badge: "text-on-surface-variant/70" },
  LOCKED: { border: "border-t-error", text: "text-error", badge: "bg-error/10 text-error" },
  FAULT: { border: "border-t-fault", text: "text-fault", badge: "bg-fault/10 text-fault" },
}

export default function SlotGrid({ slots, stale = false }: SlotGridProps) {
  const total = Math.max(slots.length, 12)

  return (
    <div>
      {stale && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-fault/40 bg-fault/10 px-3 py-2 text-label-caps text-fault uppercase">
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          Cabinet OFFLINE — data slot adalah kondisi terakhir
        </div>
      )}
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 ${stale ? "opacity-60 saturate-50" : ""}`}>
        {Array.from({ length: total }, (_, i) => {
          const slot = slots.find((s) => s.slotNumber === i + 1)
          const style = SLOT_STYLES[slot?.state ?? "EMPTY"] ?? SLOT_STYLES["EMPTY"]!
          const isEmpty = !slot || slot.state === "EMPTY"

          if (isEmpty) {
            return (
              <div
                key={i + 1}
                className="relative bg-surface-variant/50 rounded-lg p-4 flex flex-col items-center justify-center min-h-[140px] border border-dashed border-outline-variant"
              >
                <span className="absolute top-2 left-2 text-label-caps text-on-surface-variant/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="font-headline-md text-on-surface-variant/50">--</div>
                <span className="text-label-caps mt-2 text-on-surface-variant/70">EMPTY</span>
              </div>
            )
          }

          return (
            <div
              key={i + 1}
              className={`relative bg-surface-container rounded-lg p-4 flex flex-col items-center justify-center min-h-[140px] border-t-4 ${style.border} shadow-sm hover:shadow-md transition-shadow cursor-pointer ${style.pulse ? "animate-pulse-glow" : ""}`}
            >
              <span className="absolute top-2 left-2 text-label-caps text-on-surface-variant">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className={`font-display text-display ${style.text}`}>
                {slot?.soc != null ? `${slot.soc}%` : "--"}
              </div>
              <span className={`text-label-caps mt-2 px-2 py-1 rounded ${style.badge} flex items-center gap-1`}>
                {slot?.state === "CHARGING" && (
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                )}
                {slot?.state === "LOCKED" && (
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                )}
                {slot?.state === "FAULT" && (
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                )}
                {slot?.state}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
