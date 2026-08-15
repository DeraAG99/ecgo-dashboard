"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"

interface TransactionRow {
  id: string
  cabinetId: string
  cabinetCode: string
  branch: string
  userId: string
  oldBatteryId: string
  newBatteryId: string
  swappedAt: Date
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

function TransactionsInner() {
  const [rows, setRows] = useState<TransactionRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")

  const searchParams = useSearchParams()
  const router = useRouter()

  const search = searchParams.get("search") || ""
  const cabinetId = searchParams.get("cabinetId") || ""
  const limit = 20
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (cabinetId) params.set("cabinetId", cabinetId)
    router.push(`/dashboard/transactions?${params.toString()}`)
  }, [debouncedSearch, cabinetId, router])

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (search) params.set("search", search)
        if (cabinetId) params.set("cabinetId", cabinetId)
        params.set("page", String(page))
        params.set("limit", String(limit))
        const response = await fetch(`/api/transactions?${params.toString()}`)
        if (!response.ok) throw new Error("Gagal memuat transaksi")
        const data = await response.json()
        setRows(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [search, cabinetId, page])

  if (loading && rows.length === 0) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-on-surface mb-1">Riwayat Transaksi Lengkap</h1>
          <p className="text-on-surface-variant text-body-sm">
            Monitor and verify all battery swap operations across the network.
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center flex-1">
          <div className="flex items-center gap-2 bg-surface rounded-md border border-outline-variant px-3 py-1.5 min-w-[240px]">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">calendar_today</span>
            <input
              type="text"
              placeholder="Start Date - End Date"
              className="bg-transparent border-none focus:ring-0 p-0 text-body-sm text-on-surface w-full h-6 outline-none"
            />
          </div>
          <div className="relative">
            <select
              defaultValue="all"
              className="appearance-none bg-surface border border-outline-variant rounded-md pl-3 pr-8 py-1.5 text-body-sm text-on-surface focus:outline-none focus:border-primary h-[36px] min-w-[140px] cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="success">Sukses</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">
              arrow_drop_down
            </span>
          </div>
        </div>
        <div className="relative w-full sm:w-auto min-w-[260px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            badge
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari User ID atau ID Transaksi"
            className="w-full pl-9 pr-3 py-1.5 bg-surface rounded-md border border-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body-sm h-[36px]"
          />
        </div>
        <a
          href={`/api/transactions/export?search=${encodeURIComponent(search)}&cabinetId=${encodeURIComponent(cabinetId)}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-ecgo-green text-white rounded-lg text-body-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap h-[36px]"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export CSV
        </a>
      </div>

      <div className="bg-surface-container-lowest rounded-lg shadow-card border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-surface border-b border-outline-variant">
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase tracking-wider whitespace-nowrap">ID Transaksi</th>
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase tracking-wider whitespace-nowrap">Waktu</th>
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase tracking-wider whitespace-nowrap">User ID</th>
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase tracking-wider whitespace-nowrap">Lokasi Cabinet</th>
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase tracking-wider whitespace-nowrap text-center">Baterai Masuk</th>
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase tracking-wider whitespace-nowrap text-center">Baterai Keluar</th>
                <th className="py-4 px-6 text-label-caps text-secondary/80 uppercase tracking-wider whitespace-nowrap text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50 text-body-sm text-on-surface">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-on-surface-variant">
                    Tidak ada transaksi
                  </td>
                </tr>
              ) : (
                rows.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface transition-colors">
                    <td className="py-4 px-6 font-mono text-xs">{tx.id.slice(0, 12)}</td>
                    <td className="py-4 px-6 text-on-surface-variant whitespace-nowrap">
                      {tx.swappedAt ? new Date(tx.swappedAt).toLocaleString() : "-"}
                    </td>
                    <td className="py-4 px-6 font-mono">{tx.userId}</td>
                    <td className="py-4 px-6">
                      <span className="font-medium">{tx.cabinetCode || "-"}</span>
                      <span className="block text-on-surface-variant text-xs truncate max-w-[150px]">
                        {tx.branch || ""}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-surface-container px-2 py-1 rounded font-mono text-xs">
                        {tx.oldBatteryId}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-surface-container px-2 py-1 rounded font-mono text-xs">
                        {tx.newBatteryId}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 text-ecgo-green text-label-caps bg-ecgo-green/10 px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Sukses
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
        <p className="text-body-sm text-on-surface-variant">
          Menampilkan <span className="font-medium">{rows.length}</span> dari{" "}
          <span className="font-medium">{total}</span> transaksi
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
    </>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TransactionsInner />
    </Suspense>
  )
}
