"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"
import AlertSeverityBadge from "./AlertSeverityBadge"
import { formatJakarta } from "@/lib/time"

interface AlertRow {
  id: string
  type: "CABINET_OFFLINE" | "SLOT_FAULT" | "BATTERY_LOW" | "SWAP_ANOMALY"
  severity: "INFO" | "WARNING" | "CRITICAL"
  title: string
  message: string
  entityId: string | null
  read: boolean
  createdAt: Date | null
}

const TYPE_LABEL: Record<string, string> = {
  CABINET_OFFLINE: "Cabinet Offline",
  SLOT_FAULT: "Slot Fault",
  BATTERY_LOW: "Baterai Lemah",
  SWAP_ANOMALY: "Lonjakan Swap",
}

function alertHref(type: string, entityId: string | null) {
  if (!entityId) return null
  if (type === "BATTERY_LOW") return `/dashboard/batteries/${entityId}`
  return `/dashboard/cabinets/${entityId}`
}

function AlertListInner() {
  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [unread, setUnread] = useState(0)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()

  const type = searchParams.get("type") || ""
  const severity = searchParams.get("severity") || ""
  const read = searchParams.get("read") || ""
  const page = Number(searchParams.get("page") || "1") || 1
  const limit = 20

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (type) params.set("type", type)
      if (severity) params.set("severity", severity)
      if (read) params.set("read", read)
      params.set("page", String(page))
      params.set("limit", String(limit))
      const response = await fetch(`/api/dashboard/alerts?${params.toString()}`)
      if (!response.ok) throw new Error("Gagal memuat notifikasi")
      const data = await response.json()
      setAlerts(data.data)
      setUnread(data.unread)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [type, severity, read, page, limit])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleScan = async () => {
    setScanning(true)
    try {
      await fetch("/api/dashboard/alerts", { method: "POST" })
      await fetchAlerts()
    } catch {
      setError("Gagal menjalankan scan")
    } finally {
      setScanning(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/dashboard/alerts/${id}`, { method: "PATCH" })
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)))
    setUnread((u) => Math.max(0, u - 1))
  }

  const handleMarkAll = async () => {
    await fetch("/api/dashboard/alerts", { method: "PATCH" })
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
    setUnread(0)
  }

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams()
    if (type) params.set("type", type)
    if (severity) params.set("severity", severity)
    if (read) params.set("read", read)
    if (value) params.set(key, value)
    router.push(`/dashboard/alerts?${params.toString()}`)
  }

  if (loading && alerts.length === 0) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-display text-on-surface">Notifikasi</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Alert cabinet, slot, baterai, dan anomali swap.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-body-sm font-medium hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">radar</span>
            {scanning ? "Memindai..." : "Scan Sekarang"}
          </button>
          <button
            onClick={handleMarkAll}
            disabled={unread === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ecgo-green text-white rounded-lg text-body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Tandai Semua Dibaca
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "type", value: "", label: "Semua Tipe" },
          { key: "type", value: "CABINET_OFFLINE", label: "Cabinet Offline" },
          { key: "type", value: "SLOT_FAULT", label: "Slot Fault" },
          { key: "type", value: "BATTERY_LOW", label: "Baterai Lemah" },
          { key: "type", value: "SWAP_ANOMALY", label: "Lonjakan Swap" },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => updateParam(opt.key, opt.value)}
            className={`px-3 py-1.5 rounded-full text-label-caps border transition-colors ${
              type === opt.value
                ? "bg-ecgo-blue text-white border-ecgo-blue"
                : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="w-px bg-outline-variant mx-1"></span>
        {[
          { key: "read", value: "", label: "Semua" },
          { key: "read", value: "false", label: "Belum Dibaca" },
          { key: "read", value: "true", label: "Sudah Dibaca" },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => updateParam(opt.key, opt.value)}
            className={`px-3 py-1.5 rounded-full text-label-caps border transition-colors ${
              read === opt.value
                ? "bg-primary text-white border-primary"
                : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            Tidak ada notifikasi. Semua sistem berjalan normal.
          </div>
        ) : (
          alerts.map((a) => {
            const href = alertHref(a.type, a.entityId)
            const borderColor =
              a.severity === "CRITICAL"
                ? "border-l-error"
                : a.severity === "WARNING"
                ? "border-l-maintenance"
                : "border-l-primary"
            const inner = (
              <div
                className={`p-4 border border-outline-variant/50 rounded-lg bg-surface-container-lowest flex gap-3 items-start border-l-4 ${borderColor} ${
                  a.read ? "opacity-60" : ""
                }`}
              >
                <span
                  className={`material-symbols-outlined mt-0.5 text-lg ${
                    a.severity === "CRITICAL"
                      ? "text-error"
                      : a.severity === "WARNING"
                      ? "text-maintenance"
                      : "text-primary"
                  }`}
                >
                  {a.severity === "CRITICAL" ? "error" : a.severity === "WARNING" ? "warning" : "info"}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-on-surface text-body-sm">{a.title}</h4>
                    <AlertSeverityBadge severity={a.severity} />
                    <span className="text-[10px] text-on-surface-variant">{TYPE_LABEL[a.type] ?? a.type}</span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant mt-1">{a.message}</p>
                  <span className="font-mono text-[10px] text-outline mt-2 block">
                    {a.createdAt ? formatJakarta(a.createdAt) : ""}
                  </span>
                </div>
                {!a.read && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleMarkRead(a.id)
                    }}
                    className="text-primary text-body-sm hover:underline whitespace-nowrap"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
            )
            return href ? (
              <Link key={a.id} href={href} className="block">
                {inner}
              </Link>
            ) : (
              <div key={a.id}>{inner}</div>
            )
          })
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-body-sm text-on-surface-variant">
          Menampilkan <span className="font-medium">{alerts.length}</span> dari{" "}
          <span className="font-medium">{total}</span> notifikasi ·{" "}
          <span className="font-medium text-error">{unread}</span> belum dibaca
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const params = new URLSearchParams()
              if (type) params.set("type", type)
              if (severity) params.set("severity", severity)
              if (read) params.set("read", read)
              params.set("page", String(Math.max(1, page - 1)))
              router.push(`/dashboard/alerts?${params.toString()}`)
            }}
            disabled={page === 1}
            className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-body-sm text-on-surface-variant">
            Hal {page} / {totalPages}
          </span>
          <button
            onClick={() => {
              const params = new URLSearchParams()
              if (type) params.set("type", type)
              if (severity) params.set("severity", severity)
              if (read) params.set("read", read)
              params.set("page", String(Math.min(totalPages, page + 1)))
              router.push(`/dashboard/alerts?${params.toString()}`)
            }}
            disabled={page >= totalPages}
            className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AlertList() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AlertListInner />
    </Suspense>
  )
}
