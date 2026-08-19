"use client"

import { useEffect, useState } from "react"
import { formatWIB } from "@/lib/time"

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

const TECHNICIANS = ["Andi", "Budi", "Citra", "Dedi", "Eka"]
const PRIORITY_LABEL: Record<string, string> = { LOW: "Rendah", MEDIUM: "Sedang", HIGH: "Tinggi" }

export function WorkOrderDialog({
  open,
  onClose,
  value,
  onAssigned,
  onUpdated,
}: {
  open: boolean
  onClose: () => void
  value: WoRow | null
  onAssigned: (woId: string, assignedTo: string) => Promise<void>
  onUpdated: () => void
}) {
  const [alerts, setAlerts] = useState<Array<{ id: string; title: string; type: string; severity: string }>>([])
  const [title, setTitle] = useState("")
  const [entityType, setEntityType] = useState<"CABINET" | "SLOT" | "BATTERY">("CABINET")
  const [entityId, setEntityId] = useState("")
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM")
  const [source, setSource] = useState<"manual" | "alert">("manual")
  const [alertId, setAlertId] = useState("")
  const [technician, setTechnician] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && source === "alert") {
      fetch("/api/dashboard/alerts?read=false&limit=100")
        .then((r) => r.json())
        .then((d) => setAlerts(d.data ?? []))
    }
  }, [open, source])

  useEffect(() => {
    if (value) {
      setTitle(value.title ?? "")
      setEntityType((value.entityType as "CABINET" | "SLOT" | "BATTERY") ?? "CABINET")
      setEntityId(value.entityId ?? "")
      setPriority(value.priority)
      setNotes(value.notes ?? "")
    }
  }, [value])

  if (!open) return null

  const isEdit = !!value
  const submit = async () => {
    setSaving(true)
    try {
      if (isEdit && value) {
        await fetch(`/api/dashboard/maintenance/work-orders/${value.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes, status: value.status, title, priority }),
        })
      } else if (source === "alert" && alertId) {
        await fetch(`/api/dashboard/maintenance/work-orders?source=alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertId }),
        })
        setSource("manual")
      } else {
        await fetch(`/api/dashboard/maintenance/work-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType,
            entityId,
            title,
            priority,
            description: notes,
          }),
        })
      }
      setTitle("")
      setEntityId("")
      setNotes("")
      onUpdated()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const assign = async () => {
    if (!value || !technician) return
    await onAssigned(value.id, technician)
    onUpdated()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-surface-container-lowest rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex justify-between items-center">
          <h3 className="font-headline-md text-ecgo-blue">
            {isEdit ? "Detail Work Order" : "Buat Work Order"}
          </h3>
          <button onClick={onClose} className="material-symbols-outlined text-on-surface-variant">
            close
          </button>
        </div>

        {isEdit && value ? (
          <div className="mt-4 space-y-3 text-body-sm">
            <div>
              <span className="text-on-surface-variant">Judul:</span> <span className="font-medium">{value.title ?? value.id}</span>
            </div>
            <div>
              <span className="text-on-surface-variant">Entitas:</span> {value.entityLabel} ({value.entityType})
            </div>
            <div>
              <span className="text-on-surface-variant">Priority:</span> {PRIORITY_LABEL[value.priority]}
            </div>
            <div>
              <span className="text-on-surface-variant">Status:</span> {value.status}
            </div>
            <div>
              <span className="text-on-surface-variant">Teknisi:</span> {value.assignedTo ?? "-"}
            </div>
            <div>
              <span className="text-on-surface-variant">Dibuat:</span> {formatWIB(value.createdAt)}
            </div>
            {value.alertId && (
              <div>
                <span className="text-on-surface-variant">Dari alert:</span> {value.alertId}
              </div>
            )}
            <div>
              <label className="block text-label-caps text-xs text-on-surface-variant mb-1">Catatan</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm"
                rows={3}
              />
            </div>
            {!value.assignedTo && (
              <div className="flex gap-2 items-end">
                <select
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="flex-1 px-3 py-2 border border-outline-variant rounded-lg text-body-sm"
                >
                  <option value="">Pilih teknisi</option>
                  {TECHNICIANS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  onClick={assign}
                  disabled={!technician}
                  className="px-4 py-2 bg-ecgo-green text-white rounded-lg text-body-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setSource("manual")}
                className={`px-3 py-1 text-xs rounded border ${source === "manual" ? "bg-ecgo-blue text-white border-ecgo-blue" : "border-outline-variant text-on-surface-variant"}`}
              >
                Manual
              </button>
              <button
                onClick={() => setSource("alert")}
                className={`px-3 py-1 text-xs rounded border ${source === "alert" ? "bg-ecgo-blue text-white border-ecgo-blue" : "border-outline-variant text-on-surface-variant"}`}
              >
                Dari Alert
              </button>
            </div>

            {source === "alert" ? (
              <div>
                <label className="block text-label-caps text-xs text-on-surface-variant mb-1">Pilih Alert</label>
                <select
                  value={alertId}
                  onChange={(e) => setAlertId(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm"
                >
                  <option value="">-- pilih alert --</option>
                  {alerts.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.severity}] {a.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-label-caps text-xs text-on-surface-variant mb-1">Judul</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-label-caps text-xs text-on-surface-variant mb-1">Entitas</label>
                    <select value={entityType} onChange={(e) => setEntityType(e.target.value as "CABINET" | "SLOT" | "BATTERY")} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm">
                      <option value="CABINET">Cabinet</option>
                      <option value="SLOT">Slot</option>
                      <option value="BATTERY">Baterai</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-caps text-xs text-on-surface-variant mb-1">ID Entitas</label>
                    <input value={entityId} onChange={(e) => setEntityId(e.target.value)} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-label-caps text-xs text-on-surface-variant mb-1">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm">
                    <option value="LOW">Rendah</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HIGH">Tinggi</option>
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm">
            Batal
          </button>
          {!isEdit && (
            <button
              onClick={submit}
              disabled={saving || (source === "manual" && !title) || (source === "alert" && !alertId)}
              className="px-4 py-2 bg-ecgo-blue text-white rounded-lg text-body-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
