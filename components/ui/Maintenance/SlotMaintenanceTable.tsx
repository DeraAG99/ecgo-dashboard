"use client"

import { useEffect, useState } from "react"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"


interface SlotRow {
  id: string
  cabinetId: string
  cabinetCode: string
  branch: string
  slotNumber: number
  state: "EMPTY" | "CHARGING" | "FULL" | "LOCKED" | "FAULT"
  soc: number | null
  lastUpdated: Date | null
}

const STATE_LABEL: Record<string, string> = {
  EMPTY: "Kosong",
  CHARGING: "Mengisi",
  FULL: "Penuh",
  LOCKED: "Terkunci",
  FAULT: "Fault",
}
const STATE_COLOR: Record<string, string> = {
  EMPTY: "bg-empty",
  CHARGING: "bg-charging",
  FULL: "bg-full",
  LOCKED: "bg-locked",
  FAULT: "bg-fault",
}

export default function SlotMaintenanceTable() {
  const [items, setItems] = useState<SlotRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState<{ id: string; action: string } | null>(null)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchSlots = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/cabinets")
      if (!res.ok) throw new Error("Gagal memuat cabinet")
      const data = await res.json()
      const cabs: Array<{ id: string; code: string; branch: string }> = data.cabinets ?? data.data ?? []

      const all: SlotRow[] = []
      await Promise.all(
        cabs.map(async (c) => {
          const r = await fetch(`/api/cabinets/${c.id}`)
          if (!r.ok) return
          const d = await r.json()
          const slots: SlotRow[] = (d.slots ?? []).map((s: SlotRow) => ({
            ...s,
            cabinetId: c.id,
            cabinetCode: c.code,
            branch: c.branch,
          }))
          all.push(...slots)
        })
      )
      const faultLocked = all.filter((s) => s.state === "FAULT" || s.state === "LOCKED")
      setItems(faultLocked)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [])

  const actionsFor = (s: SlotRow): Array<{ value: string; label: string }> => {
    const out: Array<{ value: string; label: string }> = []
    if (s.state === "FAULT") out.push({ value: "RESET", label: "Reset → EMPTY" })
    if (s.state === "LOCKED") out.push({ value: "UNLOCK", label: "Unlock → EMPTY" })
    if (s.state === "EMPTY" || s.state === "FULL") out.push({ value: "LOCK", label: "Lock" })
    return out
  }

  const confirm = async (id: string, action: string, reasonVal: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/maintenance/slots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reasonVal }),
      })
      if (!res.ok) throw new Error("Gagal memperbarui slot")
      const json = await res.json()
      setItems((prev) => prev.map((s) => (s.id === id ? { ...s, state: json.newState } : s)))
      setTarget(null)
      setReason("")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui slot")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && items.length === 0) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div>
      <p className="text-body-sm text-on-surface-variant mb-4">
        Menampilkan slot dengan status FAULT / LOCKED ({items.length} slot).
      </p>
      <div className="overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-lowest">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-container text-on-surface-variant">
            <tr>
              <Th>Cabinet</Th>
              <Th>Cabang</Th>
              <Th>Slot</Th>
              <Th>Status</Th>
              <Th>SOC</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-on-surface-variant">
                  Tidak ada slot problem.
                </td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id} className="border-t border-outline-variant/40">
                  <Td className="font-medium">{s.cabinetCode}</Td>
                  <Td>{s.branch}</Td>
                  <Td className="text-on-surface-variant">#{s.slotNumber}</Td>
                  <Td>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium text-white px-2 py-0.5 rounded ${STATE_COLOR[s.state] ?? "bg-surface-container"}`}>
                      {STATE_LABEL[s.state] ?? s.state}
                    </span>
                  </Td>
                  <Td className="text-on-surface-variant font-mono">{s.soc ?? "-"}%</Td>
                  <Td>
                    <select
                      onChange={(e) => setTarget({ id: s.id, action: e.target.value })}
                      defaultValue=""
                      className="text-body-sm border border-outline-variant rounded px-1.5 py-0.5"
                    >
                      <option value="">Pilih aksi</option>
                      {actionsFor(s).map((a) => (
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

      {target && (
        <ActionConfirmModal
          title="Konfirmasi Aksi Slot"
          message={`Aksi ${target.action} akan mengubah state slot ini.`}
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
