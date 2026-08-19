"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"
import { formatWIB } from "@/lib/time"

interface BatteryRow {
  id: string
  batteryCode: string
  status: "AVAILABLE" | "IN_USE" | "CHARGING" | "FAULT" | "RETIRED"
  cycleCount: number
  health: number
  cabinetId: string | null
  cabinetCode: string | null
  branch: string | null
  lastSwapAt: Date | null
}

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Tersedia",
  IN_USE: "Digunakan",
  CHARGING: "Mengisi",
  FAULT: "Fault",
  RETIRED: "Pensiun",
}

export default function BatteryMaintenanceTable() {
  const [items, setItems] = useState<BatteryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState<{ id: string; action: string } | null>(null)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const statusFilter = searchParams.get("status") || ""
  const page = Number(searchParams.get("page") || "1") || 1
  const limit = 20

  const fetchBatteries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      params.set("page", String(page))
      params.set("limit", String(limit))
      const res = await fetch(`/api/dashboard/batteries?${params.toString()}`)
      if (!res.ok) throw new Error("Gagal memuat baterai")
      const data = await res.json()
      const rows: BatteryRow[] = (data.batteries ?? data.data ?? []).map((b: BatteryRow) => ({
        ...b,
        cabinetCode: b.cabinetCode ?? null,
        branch: b.branch ?? null,
      }))
      setItems(rows.filter((b) => b.status === "FAULT" || b.status === "RETIRED" || b.health < 20))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, limit])

  useEffect(() => {
    fetchBatteries()
  }, [fetchBatteries])

  const actionsFor = (b: BatteryRow): Array<{ value: string; label: string }> => {
    const out: Array<{ value: string; label: string }> = []
    if (b.status === "FAULT" || b.status === "RETIRED") {
      out.push({ value: "REACTIVATE", label: "Reactivasi → AVAILABLE" })
    }
    if (b.health < 20 && b.status !== "RETIRED") {
      out.push({ value: "RETIRE", label: "Pensiunkan" })
    }
    if (b.status === "AVAILABLE" && b.health >= 20) {
      out.push({ value: "FAULT", label: "Tandai Fault" })
    }
    return out
  }

  const confirm = async (id: string, action: string, reasonVal: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/dashboard/maintenance/batteries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reasonVal }),
      })
      if (!res.ok) throw new Error("Gagal memperbarui baterai")
      const json = await res.json()
      setItems((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: json.newStatus as BatteryRow["status"] } : b
        )
      )
      setTarget(null)
      setReason("")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui baterai")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && items.length === 0) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {["", "AVAILABLE", "IN_USE", "CHARGING", "FAULT", "RETIRED"].map((v) =>
          v === statusFilter ? (
            <span key={v || "all"} className="px-3 py-1.5 rounded-full bg-ecgo-blue text-white text-label-caps">
              {v === "" ? "Semua" : STATUS_LABEL[v]}
            </span>
          ) : (
            <button
              key={v || "all"}
              onClick={() => router.push(`/dashboard/maintenance?tab=batteries&status=${v}&page=1`)}
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
              <Th>Baterai</Th>
              <Th>Status</Th>
              <Th>Health</Th>
              <Th>Cycle</Th>
              <Th>Cabinet</Th>
              <Th>Last Swap</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-on-surface-variant">
                  Tidak ada baterai butuh perawatan.
                </td>
              </tr>
            ) : (
              items.map((b) => (
                <tr key={b.id} className="border-t border-outline-variant/40">
                  <Td className="font-medium">{b.batteryCode}</Td>
                  <Td>{STATUS_LABEL[b.status] ?? b.status}</Td>
                  <Td className="text-on-surface-variant font-mono">{b.health}%</Td>
                  <Td className="text-on-surface-variant">{b.cycleCount}</Td>
                  <Td className="text-on-surface-variant">{b.cabinetCode ?? b.branch ?? "-"}</Td>
                  <Td className="text-on-surface-variant font-mono text-xs">{formatWIB(b.lastSwapAt)}</Td>
                  <Td>
                    <select
                      onChange={(e) => setTarget({ id: b.id, action: e.target.value })}
                      defaultValue=""
                      className="text-body-sm border border-outline-variant rounded px-1.5 py-0.5"
                    >
                      <option value="">Pilih aksi</option>
                      {actionsFor(b).map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {target && actionsFor(items.find((b) => b.id === target.id) ?? ({} as BatteryRow)).length > 0 && (
        <ActionConfirmModal
          title="Konfirmasi Aksi Baterai"
          message={`Aksi ${target.action} akan mengubah status baterai ini.`}
          reason={reason}
          setReason={setReason}
          submitting={submitting}
          onConfirm={() => confirm(target.id, target.action, reason)}
          onClose={() => setTarget(null)}
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

function ActionConfirmModal({
  title,
  message,
  reason,
  setReason,
  submitting,
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  reason: string
  setReason: (v: string) => void
  submitting: boolean
  onConfirm: () => void
  onClose: () => void
}) {
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
            onClick={onConfirm}
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
