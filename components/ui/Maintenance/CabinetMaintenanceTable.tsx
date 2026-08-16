"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"
import { formatJakarta } from "@/lib/time"

interface CabinetRow {
  id: string
  code: string
  branch: string
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE"
  totalSlots: number
  filledSlots: number
  swapCount24h: number
  lastHeartbeat: Date | null
}

const STATUS_COLOR: Record<string, string> = {
  ONLINE: "bg-online",
  OFFLINE: "bg-offline",
  MAINTENANCE: "bg-maintenance",
}
const STATUS_LABEL: Record<string, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  MAINTENANCE: "Perawatan",
}

export default function CabinetMaintenanceTable() {
  const [items, setItems] = useState<CabinetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [targetStatus, setTargetStatus] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const statusFilter = searchParams.get("status") || ""
  const page = Number(searchParams.get("page") || "1") || 1
  const limit = 20

  const fetchCabs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      params.set("page", String(page))
      params.set("limit", String(limit))
      const res = await fetch(`/api/cabinets?${params.toString()}`)
      if (!res.ok) throw new Error("Gagal memuat cabinet")
      const data = await res.json()
      const rows = (data.cabinets ?? data.data ?? []).map((c: CabinetRow) => ({
        ...c,
        filledSlots: 0,
        swapCount24h: 0,
        lastHeartbeat: c.lastHeartbeat,
      }))
      setItems(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, limit])

  useEffect(() => {
    fetchCabs()
  }, [fetchCabs])

  const setNewStatus = (id: string, st: string) => {
    setTargetId(id)
    setTargetStatus(st)
  }

  const confirm = async (id: string, st: string, reasonVal: string) => {
    const action = `SET_${st}`
    setSubmitting(true)
    try {
      const res = await fetch(`/api/maintenance/cabinets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reasonVal }),
      })
      if (!res.ok) throw new Error("Gagal memperbarui status")
      const json = await res.json()
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status: json.status } : c)))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui status")
    } finally {
      setSubmitting(false)
      setTargetId(null)
    }
  }

  if (loading && items.length === 0) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {["", "ONLINE", "OFFLINE", "MAINTENANCE"].map((v) =>
          v === statusFilter ? (
            <span key={v || "all"} className="px-3 py-1.5 rounded-full bg-ecgo-blue text-white text-label-caps">
              {v === "" ? "Semua" : STATUS_LABEL[v]}
            </span>
          ) : (
            <button
              key={v || "all"}
              onClick={() => router.push(`/maintenance?tab=cabinets&status=${v}&page=1`)}
              className="px-3 py-1.5 rounded-full border border-outline-variant text-on-surface-variant text-label-caps hover:bg-surface-container"
            >
              {v === "" ? "Semua" : STATUS_LABEL[v]}
            </button>
          )
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-lowest">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-container text-on-surface-variant">
            <tr>
              <Th>Kode</Th>
              <Th>Cabang</Th>
              <Th>Status</Th>
              <Th>Slot</Th>
              <Th>Heartbeat</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-on-surface-variant">
                  Tidak ada cabinet.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="border-t border-outline-variant/40">
                  <Td className="font-medium">{c.code}</Td>
                  <Td>{c.branch}</Td>
                  <Td>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium text-white px-2 py-0.5 rounded ${STATUS_COLOR[c.status] ?? "bg-surface-container"}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </Td>
                  <Td className="text-on-surface-variant">{c.filledSlots}/{c.totalSlots}</Td>
                  <Td className="text-on-surface-variant font-mono text-xs">{formatJakarta(c.lastHeartbeat)}</Td>
                  <Td>
                    <select
                      onChange={(e) => setNewStatus(c.id, e.target.value)}
                      defaultValue=""
                      className="text-body-sm border border-outline-variant rounded px-1.5 py-0.5 text-on-surface-variant"
                    >
                      <option value="">Ubah status</option>
                      <option value="ONLINE">ONLINE</option>
                      <option value="OFFLINE">OFFLINE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {targetId && (
        <StatusConfirmModal
          title="Ubah Status Cabinet"
          message={`Masukkan alasan untuk perubahan status ke ${STATUS_LABEL[targetStatus] ?? targetStatus}.`}
          submitting={submitting}
          onConfirm={(reasonVal) => confirm(targetId, targetStatus, reasonVal)}
          onClose={() => setTargetId(null)}
        />
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

function StatusConfirmModal({
  title,
  message,
  submitting,
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  submitting: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState("")
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-surface-container-lowest rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="font-headline-md text-ecgo-blue">{title}</h3>
        <p className="text-body-sm text-on-surface-variant mt-2">{message}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Alasan (opsional)"
          className="w-full mt-3 px-3 py-2 border border-outline-variant rounded-lg text-body-sm"
          rows={3}
        />
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm">
            Batal
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={submitting}
            className="px-4 py-2 bg-ecgo-blue text-white rounded-lg text-body-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : "Konfirmasi"}
          </button>
        </div>
      </div>
    </div>
  )
}
