"use client"

import { useEffect, useState, Suspense } from "react"
import dynamic from "next/dynamic"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"
import type { MapCabinet } from "@/components/ui/Cabinet/CabinetMapTypes"

const CabinetMap = dynamic(() => import("@/components/ui/Cabinet/CabinetMap"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
})

export default function MapPage() {
  const [data, setData] = useState<MapCabinet[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        setLoading(true)
        const res = await fetch("/api/dashboard/cabinets/map")
        if (!res.ok) throw new Error("Gagal memuat peta cabinet")
        const json = await res.json()
        setData(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading)
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    )
  if (error) return <ErrorMessage message={error} />
  if (!data?.length) {
    return (
      <div className="text-center py-12 text-on-surface-variant">
        Tidak ada data cabinet untuk ditampilkan.
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-display text-on-surface">Peta Cabinet</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Lokasi, radius geofence, dan status real-time semua cabinet di peta.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-ecgo-green animate-pulse"></span>
          Auto-refresh 30s
        </span>
      </div>
      <div className="card p-4 h-[600px] overflow-hidden rounded-xl">
        <Suspense fallback={<LoadingSpinner />}>
          <CabinetMap cabinets={data} />
        </Suspense>
      </div>
    </>
  )
}
