"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"
import { formatJakarta } from "@/lib/time"
import { WorkOrderDialog } from "./WorkOrderDialog"

interface WoRow {
  id: string
  alertId: string | null
  entityType: string
  entityId: string
  entityLabel: string
  title: string | null
  description: string | null
  priority: "LOW" | "MEDIUM" | "HIGH"
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "DONE" | "CANCELLED"
  assignedTo: string | null
  notes: string | null
  createdAt: Date | null
  updatedAt: Date | null
  completedAt: Date | null
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Terbuka",
  ASSIGNED: "Ditugaskan",
  IN_PROGRESS: "Dikerjakan",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
}

const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
}

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "text-blue-600",
  MEDIUM: "text-amber-600",
  HIGH: "text-error",
}

export default function WorkOrderList() {
  const [items, setItems] = useState<WoRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<WoRow | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const status = searchParams.get("status") || ""
  const assignedTo = searchParams.get("assignedTo") || ""
  const priority = searchParams.get("priority") || ""
  const page = Number(searchParams.get("page") || "1") || 1
  const limit = 20

  const fetchWo = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (status) params.set("status", status)
      if (assignedTo) params.set("assignedTo", assignedTo)
      if (priority) params.set("priority", priority)
      params.set("page", String(page))
      params.set("limit", String(limit))
      const res = await fetch(`/api/dashboard/maintenance/work-orders?${params.toString()}`)
      if (!res.ok) throw new Error("Gagal memuat work order")
      const data = await res.json()
      setItems(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [status, assignedTo, priority, page, limit])

  useEffect(() => {
    fetchWo()
  }, [fetchWo])

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams()
    if (status) params.set("status", status)
    if (assignedTo) params.set("assignedTo", assignedTo)
    if (priority) params.set("priority", priority)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page")
    router.push(`/dashboard/maintenance?tab=work-orders&${params.toString()}`)
  }

  const goPage = (p: number) => {
    const params = new URLSearchParams()
    if (status) params.set("status", status)
    if (assignedTo) params.set("assignedTo", assignedTo)
    if (priority) params.set("priority", priority)
    params.set("page", String(p))
    router.push(`/dashboard/maintenance?tab=work-orders&${params.toString()}`)
  }

  const quickAdvance = async (wo: WoRow, next: string) => {
    const body: Record<string, unknown> = { status: next }
    if (next === "ASSIGNED" && !wo.assignedTo) {
      setSelected(wo)
      setDialogOpen(true)
      return
    }
    await fetch(`/api/dashboard/maintenance/work-orders/${wo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setItems((prev) =>
      prev.map((i) => (i.id === wo.id ? { ...i, status: next as WoRow["status"], updatedAt: new Date() } : i))
    )
  }

  const assignWo = async (woId: string, assignedToVal: string) => {
    await fetch(`/api/dashboard/maintenance/work-orders/${woId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ASSIGNED", assignedTo: assignedToVal }),
    })
    setItems((prev) =>
      prev.map((i) =>
        i.id === woId ? { ...i, status: "ASSIGNED", assignedTo: assignedToVal, updatedAt: new Date() } : i
      )
    )
  }

  const nextStep = (wo: WoRow): string | null => {
    if (wo.status === "OPEN") return "ASSIGNED"
    if (wo.status === "ASSIGNED") return "IN_PROGRESS"
    if (wo.status === "IN_PROGRESS") return "DONE"
    return null
  }

  if (loading && items.length === 0) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  const flowButtons = [
    { label: "Terbuka", value: "OPEN" },
    { label: "Ditugaskan", value: "ASSIGNED" },
    { label: "Dikerjakan", value: "IN_PROGRESS" },
    { label: "Selesai", value: "DONE" },
    { label: "Dibatalkan", value: "CANCELLED" },
  ] as const

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-ecgo-blue text-white rounded-lg text-body-sm font-medium hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Buat Work Order
        </button>
        <div className="flex flex-wrap gap-1">
          {status === "" && <span className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant text-label-caps">Semua Status</span>}
          {flowButtons.map((b) =>
            b.value === status ? (
              <span
                key={b.value}
                className="px-3 py-1.5 rounded-full bg-ecgo-blue text-white text-label-caps"
              >
                {b.label}
              </span>
            ) : (
              <button
                key={b.value}
                onClick={() => updateParam("status", b.value)}
                className="px-3 py-1.5 rounded-full border border-outline-variant text-on-surface-variant text-label-caps hover:bg-surface-container"
              >
                {b.label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-lowest">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-container text-on-surface-variant">
            <tr>
              <Th>Work Order</Th>
              <Th>Entitas</Th>
              <Th>Priority</Th>
              <Th>Status</Th>
              <Th>Teknisi</Th>
              <Th>Dibuat</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                  Tidak ada work order.
                </td>
              </tr>
            ) : (
              items.map((wo) => {
                const ns = nextStep(wo)
                return (
                  <tr key={wo.id} className="border-t border-outline-variant/40">
                    <Td className="font-medium">{wo.title ?? wo.id}</Td>
                    <Td className="text-on-surface-variant">{wo.entityLabel}</Td>
                    <Td>
                      <span className={`font-medium ${PRIORITY_COLOR[wo.priority] ?? ""}`}>{PRIORITY_LABEL[wo.priority]}</span>
                    </Td>
                    <Td>{STATUS_LABEL[wo.status] ?? wo.status}</Td>
                    <Td className="text-on-surface-variant">{wo.assignedTo ?? "-"}</Td>
                    <Td className="text-on-surface-variant font-mono text-xs">{formatJakarta(wo.createdAt)}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        {ns && (
                          <button
                            onClick={() => quickAdvance(wo, ns)}
                            className="px-2 py-1 text-xs border border-outline-variant rounded hover:bg-surface-container"
                          >
                            {ns === "ASSIGNED" ? "Assign→" : ns === "IN_PROGRESS" ? "Kerjakan→" : "Selesai→"}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelected(wo)
                            setDialogOpen(true)
                          }}
                          className="px-2 py-1 text-xs border border-outline-variant rounded hover:bg-surface-container"
                        >
                          Detail
                        </button>
                      </div>
                    </Td>
                  </tr>
                )
              })
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
            <span>
              Hal {page} / {totalPages}
            </span>
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

      <WorkOrderDialog open={dialogOpen} onClose={() => setDialogOpen(false)} value={selected} onAssigned={assignWo} onUpdated={fetchWo} />
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-label-caps text-xs text-on-surface-variant">{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2 ${className ?? ""}`}>{children}</td>
}
