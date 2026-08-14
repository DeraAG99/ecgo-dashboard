"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter, notFound } from "next/navigation"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"
import StatusBadge from "@/components/shared/StatusBadge"
import type { Slot } from "@/lib/schema"

interface CabinetDetailData {
  id: string
  code: string
  branch: string
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE"
  lastHeartbeat: Date | null
  slots: Slot[]
  swapHistory: {
    id: string
    userId: string
    oldBatteryId: string
    newBatteryId: string
    swappedAt: Date
  }[]
  chartData: { hour: string; count: number }[]
}

const SLOT_STYLES: Record<string, { border: string; text: string; badge: string; pulse?: boolean }> = {
  FULL: { border: "border-t-ecgo-green", text: "text-ecgo-green", badge: "bg-ecgo-green/10 text-ecgo-green" },
  CHARGING: { border: "border-t-charging", text: "text-charging", badge: "bg-charging/10 text-charging", pulse: true },
  EMPTY: { border: "", text: "text-on-surface-variant/50", badge: "text-on-surface-variant/70" },
  LOCKED: { border: "border-t-error", text: "text-error", badge: "bg-error/10 text-error" },
  FAULT: { border: "border-t-fault", text: "text-fault", badge: "bg-fault/10 text-fault" },
}

export default function CabinetDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [cabinet, setCabinet] = useState<CabinetDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCabinet = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/cabinets/${id}`)
      if (response.status === 404) {
        notFound()
        return
      }
      if (!response.ok) throw new Error("Cabinet tidak ditemukan")
      setCabinet(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCabinet()
  }, [fetchCabinet])

  useEffect(() => {
    if (!id) return
    const interval = setInterval(fetchCabinet, 30000)
    return () => clearInterval(interval)
  }, [fetchCabinet, id])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!cabinet) return null

  const totalSwap24h = cabinet.chartData.reduce((acc, c) => acc + c.count, 0)
  const maxChart = Math.max(...cabinet.chartData.map((c) => c.count), 1)

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/cabinets")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-variant text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-display text-ecgo-blue">{cabinet.code}</h2>
              <StatusBadge status={cabinet.status} />
            </div>
            <p className="text-body-sm text-on-surface-variant mt-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">location_on</span>
              Branch: {cabinet.branch} • Heartbeat:{" "}
              {cabinet.lastHeartbeat ? new Date(cabinet.lastHeartbeat).toLocaleString() : "Tidak ada data"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-surface-container rounded-lg text-on-surface text-body-sm font-medium hover:bg-surface-variant transition-colors flex items-center gap-2 border border-outline-variant">
            <span className="material-symbols-outlined text-sm">lock_open</span>
            Unlock All
          </button>
          <button className="px-4 py-2 bg-ecgo-blue text-white rounded-lg text-body-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-sm">power_settings_new</span>
            Restart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-md text-ecgo-blue">Status Slot Baterai</h3>
              <div className="flex gap-3 text-label-caps text-on-surface-variant uppercase flex-wrap">
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-ecgo-green"></div> Full</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-charging"></div> Charging</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-surface-variant border border-outline-variant"></div> Empty</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-error"></div> Locked</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-fault"></div> Fault</span>
              </div>
            </div>
            <SlotGrid slots={cabinet.slots} />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 flex flex-col h-[320px]">
            <h3 className="font-headline-md text-ecgo-blue mb-4">Swap per Jam</h3>
            <div className="flex-1 w-full relative flex items-end gap-1">
              {cabinet.chartData.map((item) => (
                <div key={item.hour} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <span className="text-[10px] font-mono text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div
                    className="w-full bg-ecgo-green/80 rounded-t-sm group-hover:bg-ecgo-green transition-colors"
                    style={{ height: `${Math.max((item.count / maxChart) * 80, 2)}%` }}
                  ></div>
                  <span className="text-[9px] font-mono text-outline mt-1">{item.hour.split(":")[0]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <span className="text-label-caps text-on-surface-variant uppercase">Total Swap (24h)</span>
              <div className="font-display text-display text-ecgo-blue mt-1">{totalSwap24h}</div>
            </div>
            <div className="card p-4">
              <span className="text-label-caps text-on-surface-variant uppercase">Uptime</span>
              <div className="font-display text-display text-ecgo-blue mt-1">
                {cabinet.status === "ONLINE" ? "100%" : "0%"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline-md text-ecgo-blue">Daftar Transaksi Terakhir</h3>
          <button
            onClick={() => router.push(`/dashboard/transactions?cabinetId=${cabinet.id}`)}
            className="text-primary font-medium text-body-sm hover:underline"
          >
            Lihat Semua
          </button>
        </div>
        <TransactionList transactions={cabinet.swapHistory} />
      </div>
    </>
  )
}

function SlotGrid({ slots }: { slots: Slot[] }) {
  const total = Math.max(slots.length, 12)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
  )
}

function TransactionList({ transactions }: { transactions: CabinetDetailData["swapHistory"] }) {
  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-on-surface-variant">Tidak ada riwayat transaksi</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-outline-variant/30">
            <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">Waktu</th>
            <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">User ID</th>
            <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">Baterai Lama</th>
            <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">Baterai Baru</th>
            <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider text-right">Status</th>
          </tr>
        </thead>
        <tbody className="font-mono text-data-mono text-on-surface">
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-outline-variant/20 hover:bg-surface-dim transition-colors">
              <td className="py-3 px-4 text-on-surface-variant">
                {tx.swappedAt ? new Date(tx.swappedAt).toLocaleString() : "-"}
              </td>
              <td className="py-3 px-4">{tx.userId}</td>
              <td className="py-3 px-4">
                <span className="bg-surface-container px-2 py-1 rounded">{tx.oldBatteryId}</span>
              </td>
              <td className="py-3 px-4">
                <span className="bg-surface-container px-2 py-1 rounded">{tx.newBatteryId}</span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className="inline-flex items-center gap-1 text-ecgo-green text-label-caps bg-ecgo-green/10 px-2 py-1 rounded">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Sukses
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
