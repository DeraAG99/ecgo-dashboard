"use client"

import { useEffect, useState } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"

interface SummaryData {
  cabinets: { ONLINE: number; OFFLINE: number; MAINTENANCE: number }
  slots: { EMPTY: number; CHARGING: number; FULL: number; LOCKED: number; FAULT: number }
  slotFaultCount: number
  slotLockedCount: number
  batteries: { AVAILABLE: number; IN_USE: number; CHARGING: number; FAULT: number; RETIRED: number }
  batteryLowHealthCount: number
  batteryHealthBuckets: Record<string, number>
  alerts: { unresolved: number }
  workOrders: { byStatus: Record<string, number>; openCount: number }
}

const STATUS_COLORS: Record<string, string> = {
  ONLINE: "#22c55e",
  OFFLINE: "#6b7280",
  MAINTENANCE: "#a16207",
  AVAILABLE: "#22c55e",
  IN_USE: "#22c55e",
  CHARGING: "#3b82f6",
  FAULT: "#f97316",
  RETIRED: "#ef4444",
  EMPTY: "#9ca3af",
  FULL: "#22c55e",
  LOCKED: "#ef4444",
}

export default function MaintenanceSummary() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/dashboard/maintenance/summary")
        if (!res.ok) throw new Error("Gagal memuat ringkasan")
        setData(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!data) return null

  const cabinetData = Object.entries(data.cabinets).map(([k, v]) => ({ status: k, count: v }))
  const woData = Object.entries(data.workOrders.byStatus).map(([k, v]) => ({ status: k, count: v }))
  const healthData = Object.entries(data.batteryHealthBuckets).map(([k, v]) => ({ bucket: k, count: v }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SummaryCard title="Status Cabinet">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cabinetData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count">
              {cabinetData.map((e) => (
                <Cell key={e.status} fill={STATUS_COLORS[e.status] ?? "#9ca3af"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SummaryCard>

      <SummaryCard title="Health Baterai (bucket)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={healthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </SummaryCard>

      <SummaryCard title="Distribusi Slot">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Tooltip />
            <Pie
              data={Object.entries(data.slots).map(([k, v]) => ({ name: k, value: v }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label
            >
              {Object.entries(data.slots).map(([k]) => (
                <Cell key={k} fill={STATUS_COLORS[k] ?? "#9ca3af"} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </SummaryCard>

      <SummaryCard title="Work Order by Status">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={woData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#1a2b4c" />
          </BarChart>
        </ResponsiveContainer>
      </SummaryCard>

      <SummaryCard
        title="Indikator Kritis"
        subtitle={
          <div className="flex flex-wrap gap-4 text-body-sm mt-2">
            <span className="text-error">Fault slot: {data.slotFaultCount}</span>
            <span className="text-warning">Locked slot: {data.slotLockedCount}</span>
            <span className="text-error">Baterai low health: {data.batteryLowHealthCount}</span>
            <span className="text-error">Alert belum resolved: {data.alerts.unresolved}</span>
            <span className="text-maintenance">WO terbuka: {data.workOrders.openCount}</span>
          </div>
        }
      />
    </div>
  )
}

function SummaryCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
      <h3 className="font-headline-md text-ecgo-blue">{title}</h3>
      {children}
      {subtitle}
    </div>
  )
}
