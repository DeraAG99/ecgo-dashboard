"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { formatWIB } from "@/lib/time"

interface AlertRow {
  id: string
  type: "CABINET_OFFLINE" | "SLOT_FAULT" | "BATTERY_LOW" | "SWAP_ANOMALY"
  severity: "INFO" | "WARNING" | "CRITICAL"
  title: string
  createdAt: Date | null
  read: boolean
}

export default function AlertBell() {
  const [unread, setUnread] = useState(0)
  const [recent, setRecent] = useState<AlertRow[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true

    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/dashboard/alerts?limit=5&read=false")
        if (!response.ok) return
        const data = await response.json()
        if (!mounted) return
        setUnread(data.unread)
        setRecent(data.data)
      } catch {
        // ignore
      }
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/dashboard/alerts/${id}`, { method: "PATCH" })
    setRecent((prev) => prev.filter((a) => a.id !== id))
    setUnread((u) => Math.max(0, u - 1))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-1 rounded-lg hover:bg-surface-container transition-colors"
        aria-label="Notifikasi"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-error text-white text-[10px] font-semibold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/50">
            <h4 className="font-semibold text-on-surface text-body-sm">Notifikasi</h4>
            <span className="text-[11px] text-on-surface-variant">{unread} belum dibaca</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="px-4 py-6 text-center text-on-surface-variant text-body-sm">
                Tidak ada notifikasi baru.
              </div>
            ) : (
              recent.map((a) => (
                <div key={a.id} className="px-4 py-3 flex gap-3 items-start hover:bg-surface-container transition-colors">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.severity === "CRITICAL" ? "bg-error" : a.severity === "WARNING" ? "bg-maintenance" : "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-on-surface truncate">{a.title}</p>
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      {a.createdAt ? formatWIB(a.createdAt) : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => handleMarkRead(a.id)}
                    className="text-[11px] text-primary hover:underline whitespace-nowrap"
                  >
                    Baca
                  </button>
                </div>
              ))
            )}
          </div>
          <Link
            href="/dashboard/alerts"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 border-t border-outline-variant/50 text-center text-body-sm text-primary font-medium hover:bg-surface-container transition-colors"
          >
            Lihat semua notifikasi
          </Link>
        </div>
      )}
    </div>
  )
}
