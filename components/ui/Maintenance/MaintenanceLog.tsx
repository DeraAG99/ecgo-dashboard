"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"
import { formatJakarta } from "@/lib/time"

interface LogRow {
  id: string
  action: string
  entityType: string
  entityId: string | null
  entityLabel: string | null
  detail: string | null
  createdAt: Date | null
}

export default function MaintenanceLog() {
  const [items, setItems] = useState<LogRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const page = Number(searchParams.get("page") || "1") || 1
  const limit = 50

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(limit))
      const res = await fetch(`/api/dashboard/maintenance/logs?${params.toString()}`)
      if (!res.ok) throw new Error("Gagal memuat log")
      const data = await res.json()
      setItems(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const goPage = (p: number) => {
    router.push(`/dashboard/maintenance?tab=log&page=${p}`)
  }

  if (loading && items.length === 0) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-lowest">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-container text-on-surface-variant">
            <tr>
              <Th>Aksi</Th>
              <Th>Entitas</Th>
              <Th>Label</Th>
              <Th>Detail</Th>
              <Th>Waktu</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-on-surface-variant">
                  Belum ada aktivitas maintenance.
                </td>
              </tr>
            ) : (
              items.map((l) => (
                <tr key={l.id} className="border-t border-outline-variant/40">
                  <Td className="font-mono text-xs">{l.action}</Td>
                  <Td className="text-on-surface-variant">{l.entityType}</Td>
                  <Td className="text-on-surface-variant">{l.entityLabel ?? "-"}</Td>
                  <Td className="text-on-surface-variant text-xs">{l.detail ?? "-"}</Td>
                  <Td className="text-on-surface-variant font-mono text-xs">{formatJakarta(l.createdAt)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {total > 0 && (
        <div className="flex justify-between items-center mt-4 text-body-sm text-on-surface-variant">
          <span>
            Menampilkan {items.length} dari {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => goPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-outline-variant rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>Hal {page} / {totalPages}</span>
            <button
              onClick={() => goPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-outline-variant rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-label-caps text-xs text-on-surface-variant">{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2 ${className ?? ""}`}>{children}</td>
}
