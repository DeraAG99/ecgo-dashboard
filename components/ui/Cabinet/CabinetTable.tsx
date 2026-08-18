"use client"

import { useEffect, useState, useRef, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import StatusBadge from "@/components/shared/StatusBadge"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"
import { formatJakarta } from "@/lib/time"

interface CabinetRow {
  id: string
  code: string
  branch: string
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE"
  filledSlots: number
  totalSlots: number
  swapCount24h: number
  lastHeartbeat: Date | null
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timeoutRef.current)
  }, [value, delay])

  return debouncedValue
}

function CabinetTableInner() {
  const [cabinets, setCabinets] = useState<CabinetRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")

  const searchParams = useSearchParams()
  const router = useRouter()

  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""
  const limit = 10
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (status) params.set("status", status)
    router.push(`/dashboard/cabinets?${params.toString()}`)
  }, [debouncedSearch, status, router])

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  const fetchCabinets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (status) params.set("status", status)
      params.set("page", String(page))
      params.set("limit", String(limit))
      const response = await fetch(`/api/dashboard/cabinets?${params.toString()}`)
      if (!response.ok) throw new Error("Gagal memuat data cabinet")
      const data = await response.json()
      setCabinets(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [search, status, page, limit])

  useEffect(() => {
    fetchCabinets()
  }, [fetchCabinets])

  useEffect(() => {
    const interval = setInterval(fetchCabinets, 30000)
    return () => clearInterval(interval)
  }, [fetchCabinets])

  if (loading && cabinets.length === 0) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-display text-on-surface">Daftar Cabinet</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Manage and monitor all deployed battery swap stations.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari kode cabinet atau cabang..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            />
          </div>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => {
                setPage(1)
                const params = new URLSearchParams()
                if (searchInput || search) params.set("search", searchInput || search)
                if (e.target.value) params.set("status", e.target.value)
                router.push(`/dashboard/cabinets?${params.toString()}`)
              }}
              className="appearance-none w-full sm:w-auto pl-4 pr-10 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer"
            >
              <option value="">Status: ALL</option>
              <option value="ONLINE">ONLINE</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
              expand_more
            </span>
          </div>
          <a
            href={`/api/dashboard/cabinets/export?search=${encodeURIComponent(search)}&status=${status}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-ecgo-green text-white rounded-lg text-body-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </a>
          <span className="inline-flex items-center gap-2 text-xs text-on-surface-variant whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-ecgo-green animate-pulse"></span>
            Auto-refresh 30s
          </span>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ecgo-blue/5 border-b border-outline-variant">
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase">Kode Cabinet</th>
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase">Cabang</th>
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase">Status</th>
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase">Slot Terisi</th>
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase">Swap 24 Jam</th>
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase">Heartbeat Terakhir</th>
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-body-sm text-on-surface divide-y divide-outline-variant/50">
              {cabinets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-on-surface-variant">
                    Tidak ada data cabinet
                  </td>
                </tr>
              ) : (
                cabinets.map((cabinet) => (
                  <tr key={cabinet.id} className="hover:bg-surface transition-colors">
                    <td className="py-4 px-6 font-mono font-medium">{cabinet.code}</td>
                    <td className="py-4 px-6 font-medium">{cabinet.branch}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={cabinet.status} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-surface-variant rounded-full overflow-hidden">
                          <div
                            className="bg-ecgo-green h-full rounded-full"
                            style={{ width: `${Math.min((cabinet.filledSlots / cabinet.totalSlots) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-xs">
                          {cabinet.filledSlots}/{cabinet.totalSlots}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono">{cabinet.swapCount24h}</td>
                    <td className="py-4 px-6 text-on-surface-variant">
                      {cabinet.lastHeartbeat ? formatJakarta(cabinet.lastHeartbeat) : "-"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/dashboard/cabinets/${cabinet.id}`}
                        className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
                      >
                        Detail <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-body-sm text-on-surface-variant">
          Menampilkan <span className="font-medium">{cabinets.length}</span> dari{" "}
          <span className="font-medium">{total}</span> cabinets
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-body-sm text-on-surface-variant">
            Hal {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

export default function CabinetTable() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CabinetTableInner />
    </Suspense>
  )
}
