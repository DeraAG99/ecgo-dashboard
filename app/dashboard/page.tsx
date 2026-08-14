"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"

interface DashboardData {
  totalCabinets: number
  onlineCabinets: number
  offlineCabinets: number
  maintenanceCabinets: number
  totalSwapToday: number
  totalSwap7d: number
  batteriesAvailable: number
  batteriesCharging: number
  batteriesEmpty: number
  batteriesLocked: number
  batteriesFault: number
  weeklyTrend: { day: string; total: number }[]
  alerts: {
    id: string
    code: string
    branch: string
    status: "ONLINE" | "OFFLINE" | "MAINTENANCE"
    lastHeartbeat: Date | null
  }[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard")
        if (!response.ok) throw new Error("Gagal memuat data dashboard")
        setData(await response.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!data) return null

  const maxTrend = Math.max(...data.weeklyTrend.map((d) => d.total), 1)
  const uptime =
    data.totalCabinets > 0
      ? Math.round((data.onlineCabinets / data.totalCabinets) * 1000) / 10
      : 0

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="font-display text-display text-on-surface">Overview</h2>
          <p className="text-body-lg text-on-surface-variant mt-1">
            Real-time performance metrics dan status sistem.
          </p>
        </div>
        <div className="font-mono text-data-mono text-secondary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-ecgo-green animate-pulse"></span>
          Live Data
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Total Swap Hari Ini"
          icon="swap_horiz"
          value={data.totalSwapToday.toLocaleString()}
          trend="Swap 24 jam terakhir"
          href="/dashboard/transactions"
        />
        <MetricCard
          label="Cabinet Aktif"
          icon="ev_station"
          value={`${data.onlineCabinets}`}
          sub={`/ ${data.totalCabinets}`}
          trend={`${uptime}% uptime rate`}
          href="/dashboard/cabinets"
        />
        <MetricCard
          label="Baterai Tersedia"
          icon="battery_charging_full"
          value={data.batteriesAvailable.toLocaleString()}
          trend={`${data.batteriesCharging} dalam pengisian`}
          href="/dashboard/cabinets"
        />
        <MetricCard
          label="Swap 7 Hari"
          icon="trending_up"
          value={data.totalSwap7d.toLocaleString()}
          trend="Total transaksi mingguan"
          href="/dashboard/transactions"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-ecgo-blue">Tren Swap Mingguan</h3>
          </div>
          <div className="flex items-end justify-between gap-2 h-48 px-2 pb-6 pt-4">
            {data.weeklyTrend.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center group">
                <span className="text-xs font-mono text-on-surface-variant mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.total}
                </span>
                <div
                  className={`w-full rounded-t-sm ${
                    d.total === maxTrend ? "bg-ecgo-green" : "bg-surface-container-highest group-hover:bg-ecgo-green/50"
                  }`}
                  style={{ height: `${Math.max((d.total / maxTrend) * 100, 4)}%` }}
                ></div>
                <span className="text-[10px] font-mono text-outline mt-2">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-ecgo-blue">Status Cabinet</h3>
            <span className="bg-error/10 text-error label-caps px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              {data.offlineCabinets + data.maintenanceCabinets} Alerts
            </span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {data.alerts.length === 0 ? (
              <p className="text-on-surface-variant text-body-sm py-4 text-center">
                Semua cabinet dalam kondisi baik.
              </p>
            ) : (
              data.alerts.map((a) => {
                const isOffline = a.status === "OFFLINE"
                return (
                <Link
                  key={a.id}
                  href={`/dashboard/cabinets/${a.id}`}
                  className={`p-3 border border-outline-variant/50 rounded-lg flex gap-3 items-start transition-colors cursor-pointer border-l-4 ${
                    isOffline
                      ? "bg-error/5 hover:bg-error/10 border-l-error"
                      : "bg-maintenance/5 hover:bg-maintenance/10 border-l-maintenance"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined mt-0.5 text-lg ${
                      isOffline ? "text-error" : "text-maintenance"
                    }`}
                  >
                    warning
                  </span>
                  <div>
                    <h4 className="font-semibold text-on-surface text-body-sm">{a.code}</h4>
                    <p className="text-[12px] text-on-surface-variant mt-0.5">
                      {isOffline ? "Koneksi terputus." : "Jadwal perawatan rutin."}
                    </p>
                    <span className="font-mono text-[10px] text-outline mt-2 block">
                      Loc: {a.branch}
                    </span>
                  </div>
                </Link>
              )
              })
            )}
          </div>
          <Link
            href="/dashboard/cabinets"
            className="mt-4 w-full block text-center py-2 border border-outline text-secondary text-body-sm rounded-lg hover:bg-surface-container transition-colors font-medium"
          >
            Lihat Semua Cabinet
          </Link>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline-md text-ecgo-blue">Ringkasan Status Cabinet</h3>
          <Link href="/dashboard/cabinets" className="flex items-center gap-1 text-primary text-body-sm hover:underline">
            Buka Cabinet List <span className="material-symbols-outlined text-sm">open_in_new</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-ecgo-green"></span>
            <span className="text-on-surface">Online ({data.onlineCabinets})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-maintenance"></span>
            <span className="text-on-surface">Maintenance ({data.maintenanceCabinets})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-error"></span>
            <span className="text-on-surface">Offline ({data.offlineCabinets})</span>
          </div>
        </div>
        <div className="mt-6">
          <h4 className="text-label-caps text-on-surface-variant mb-3">Distribusi Slot</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SlotStat label="FULL" value={data.batteriesAvailable} className="bg-full/10 text-full" />
            <SlotStat label="CHARGING" value={data.batteriesCharging} className="bg-charging/10 text-charging" />
            <SlotStat label="EMPTY" value={data.batteriesEmpty} className="bg-surface-container text-on-surface-variant" />
            <SlotStat label="LOCKED" value={data.batteriesLocked} className="bg-locked/10 text-locked" />
            <SlotStat label="FAULT" value={data.batteriesFault} className="bg-fault/10 text-fault" />
          </div>
        </div>
      </div>
    </>
  )
}

function MetricCard({
  label,
  icon,
  value,
  sub,
  trend,
  href,
}: {
  label: string
  icon: string
  value: string
  sub?: string
  trend: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="card card-hover p-6 relative overflow-hidden group block"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-label-caps text-secondary uppercase tracking-wider">{label}</span>
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div className="font-display text-display text-on-surface">
        {value}
        {sub && <span className="text-headline-md text-on-surface-variant"> {sub}</span>}
      </div>
      <div className="flex items-center gap-2 mt-2 text-body-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px] text-ecgo-green">trending_up</span>
        <span>{trend}</span>
      </div>
    </Link>
  )
}

function SlotStat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-lg p-4 text-center ${className}`}>
      <div className="font-display text-display">{value.toLocaleString()}</div>
      <div className="text-label-caps mt-1">{label}</div>
    </div>
  )
}
