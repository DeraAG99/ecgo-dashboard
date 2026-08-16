"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts"

interface ForecastData {
  branch: string | null
  days: number
  totalActual: number
  totalPredicted: number
  avgPerDayActual: number
  avgPerDayPredicted: number
  peakHour: { hour: number; avg: number }
  historicalDaily: Array<{ date: string; swaps: number }>
  forecastDaily: Array<{ date: string; predicted: number }>
  hourlyPattern: Array<{ hour: number; avg: number }>
  byCabinet: Array<{ id: string; code: string; branch: string; dailyAvg: number; predictedTotal: number }>
}

function shortDate(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  })
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="p-4 border border-outline-variant/50 rounded-lg bg-surface-container-lowest">
      <p className="text-[11px] text-on-surface-variant font-medium">{label}</p>
      <p className={`font-display text-headline-sm mt-1 ${accent ? "text-ecgo-green" : "text-on-surface"}`}>{value}</p>
      {sub && <p className="text-[11px] text-on-surface-variant mt-1">{sub}</p>}
    </div>
  )
}

function ForecastInner() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const branch = searchParams.get("branch") || ""
  const days = Number(searchParams.get("days") || "7") || 7

  const fetchForecast = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (branch) params.set("branch", branch)
      params.set("days", String(days))
      const response = await fetch(`/api/forecast?${params.toString()}`)
      if (!response.ok) throw new Error("Gagal memuat data forecast")
      setData(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [branch, days])

  useEffect(() => {
    fetchForecast()
  }, [fetchForecast])

  const updateDays = (value: number) => {
    const params = new URLSearchParams()
    if (branch) params.set("branch", branch)
    params.set("days", String(value))
    router.push(`/dashboard/forecast?${params.toString()}`)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!data) return null

  const combined = [
    ...data.historicalDaily.map((d) => ({
      label: shortDate(d.date),
      actual: d.swaps,
      predicted: null as number | null,
    })),
    ...data.forecastDaily.map((d) => ({
      label: shortDate(d.date),
      actual: null as number | null,
      predicted: d.predicted,
    })),
  ]

  const hourLabels = data.hourlyPattern.map((h) => ({
    hour: `${String(h.hour).padStart(2, "0")}:00`,
    avg: h.avg,
  }))

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-display text-on-surface">Perkiraan Permintaan</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Proyeksi swap harian berdasarkan pola historis per jam & hari dalam seminggu.
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14].map((d) => (
            <button
              key={d}
              onClick={() => updateDays(d)}
              className={`px-4 py-2 rounded-lg text-body-sm font-medium border transition-colors ${
                days === d
                  ? "bg-ecgo-blue text-white border-ecgo-blue"
                  : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {d} hari
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={`Prediksi swap (${data.days} hari)`}
          value={String(data.totalPredicted)}
          sub={`Rata-rata ${data.avgPerDayPredicted}/hari`}
          accent
        />
        <KpiCard
          label="Aktual swap (7 hari terakhir)"
          value={String(data.totalActual)}
          sub={`Rata-rata ${data.avgPerDayActual}/hari`}
        />
        <KpiCard
          label="Jam puncak permintaan"
          value={`${String(data.peakHour.hour).padStart(2, "0")}:00 WIB`}
          sub={`Rata-rata ${data.peakHour.avg} swap`}
        />
        <KpiCard
          label="Lonjakan prediksi vs aktual"
          value={
            data.avgPerDayActual > 0
              ? `${Math.round(((data.avgPerDayPredicted - data.avgPerDayActual) / data.avgPerDayActual) * 100)}%`
              : "—"
          }
          sub="Perubahan rata-rata per hari"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 p-4 border border-outline-variant/50 rounded-lg bg-surface-container-lowest">
          <h3 className="font-semibold text-on-surface text-body-sm mb-4">Swap Harian: Aktual vs Prediksi</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combined} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="rgba(0,0,0,0.35)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="rgba(0,0,0,0.35)" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="actual" name="Aktual" fill="#1A2B4C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="predicted" name="Prediksi" fill="#00A651" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 border border-outline-variant/50 rounded-lg bg-surface-container-lowest">
          <h3 className="font-semibold text-on-surface text-body-sm mb-4">Pola Permintaan per Jam</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourLabels} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="hour" interval={3} tick={{ fontSize: 10 }} stroke="rgba(0,0,0,0.35)" />
                <YAxis tick={{ fontSize: 11 }} stroke="rgba(0,0,0,0.35)" />
                <Tooltip />
                <Line type="monotone" dataKey="avg" name="Rata-rata swap" stroke="#00A651" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-4 border border-outline-variant/50 rounded-lg bg-surface-container-lowest">
        <h3 className="font-semibold text-on-surface text-body-sm mb-4">
          Proyeksi per Cabinet ({data.branch ?? "Semua cabang"})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-[11px] uppercase tracking-wide text-on-surface-variant">
                <th className="py-2 pr-4">Kode</th>
                <th className="py-2 pr-4">Cabang</th>
                <th className="py-2 pr-4">Rata-rata/hari</th>
                <th className="py-2">Prediksi {data.days} hari</th>
              </tr>
            </thead>
            <tbody>
              {data.byCabinet.map((c) => (
                <tr key={c.id} className="border-b border-outline-variant/40 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-on-surface">{c.code}</td>
                  <td className="py-2.5 pr-4 text-on-surface-variant">{c.branch}</td>
                  <td className="py-2.5 pr-4 font-mono text-on-surface-variant">{c.dailyAvg}</td>
                  <td className="py-2.5 font-mono font-semibold text-ecgo-green">{c.predictedTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function ForecastChart() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ForecastInner />
    </Suspense>
  )
}
