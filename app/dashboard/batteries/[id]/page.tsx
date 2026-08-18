"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter, notFound } from "next/navigation"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"
import BatteryStatusBadge from "@/components/ui/Battery/BatteryStatusBadge"
import { formatJakarta } from "@/lib/time"
import Link from "next/link"

interface BatteryDetailData {
  battery: {
    id: string
    batteryCode: string
    status: "AVAILABLE" | "IN_USE" | "CHARGING" | "FAULT" | "RETIRED"
    cycleCount: number
    health: number
    cabinetId: string | null
    cabinet: {
      id: string
      code: string
      branch: string
    } | null
    lastSwapAt: Date | null
    createdAt: Date | null
  }
  history: {
    id: string
    userId: string
    oldBatteryId: string
    newBatteryId: string
    cabinetId: string
    cabinetCode: string
    branch: string
    swappedAt: Date
  }[]
}

function healthColor(health: number) {
  if (health >= 80) return "bg-full"
  if (health >= 50) return "bg-maintenance"
  return "bg-error"
}

export default function BatteryDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<BatteryDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBattery = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/dashboard/batteries/${id}`)
      if (response.status === 404) {
        notFound()
        return
      }
      if (!response.ok) throw new Error("Baterai tidak ditemukan")
      setData(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBattery()
  }, [fetchBattery])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!data) return null

  const { battery, history } = data

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/batteries")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-variant text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-display text-ecgo-blue font-mono">{battery.batteryCode}</h2>
            <BatteryStatusBadge status={battery.status} />
          </div>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {battery.cabinet ? (
              <>
                Berada di{" "}
                <Link href={`/dashboard/cabinets/${battery.cabinet.id}`} className="text-primary hover:underline">
                  {battery.cabinet.code} ({battery.cabinet.branch})
                </Link>
              </>
            ) : (
              "Sedang digunakan / di luar cabinet"
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <span className="text-label-caps text-on-surface-variant uppercase">Kesehatan</span>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-3 bg-surface-variant rounded-full overflow-hidden">
              <div className={`${healthColor(battery.health)} h-full rounded-full`} style={{ width: `${battery.health}%` }}></div>
            </div>
            <span className="font-display text-display text-ecgo-blue">{battery.health}%</span>
          </div>
          {battery.health < 20 && (
            <p className="mt-3 text-body-sm text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">warning</span>
              Baterai perlu diganti
            </p>
          )}
        </div>
        <div className="card p-6">
          <span className="text-label-caps text-on-surface-variant uppercase">Total Siklus</span>
          <div className="font-display text-display text-ecgo-blue mt-3">{battery.cycleCount}</div>
          <p className="text-body-sm text-on-surface-variant mt-1">cycle</p>
        </div>
        <div className="card p-6">
          <span className="text-label-caps text-on-surface-variant uppercase">Status</span>
          <div className="mt-3">
            <BatteryStatusBadge status={battery.status} />
          </div>
        </div>
        <div className="card p-6">
          <span className="text-label-caps text-on-surface-variant uppercase">Swap Terakhir</span>
          <div className="font-display text-headline-md text-ecgo-blue mt-3">
            {battery.lastSwapAt ? formatJakarta(battery.lastSwapAt) : "-"}
          </div>
        </div>
      </div>

      <div className="card p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline-md text-ecgo-blue">Riwayat Swap Baterai</h3>
        </div>
        {history.length === 0 ? (
          <div className="py-8 text-center text-on-surface-variant">Tidak ada riwayat transaksi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-outline-variant/30">
                  <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">Waktu</th>
                  <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">User ID</th>
                  <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">Cabinet</th>
                  <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">Posisi</th>
                </tr>
              </thead>
              <tbody className="font-mono text-data-mono text-on-surface">
                {history.map((tx) => (
                  <tr key={tx.id} className="border-b border-outline-variant/20 hover:bg-surface-dim transition-colors">
                    <td className="py-3 px-4 text-on-surface-variant">{formatJakarta(tx.swappedAt)}</td>
                    <td className="py-3 px-4">{tx.userId}</td>
                    <td className="py-3 px-4">
                      {tx.branch} ({tx.cabinetCode})
                    </td>
                    <td className="py-3 px-4">
                      {tx.newBatteryId === battery.batteryCode ? (
                        <span className="text-ecgo-green">Keluar dari cabinet</span>
                      ) : (
                        <span className="text-on-surface-variant">Masuk ke cabinet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
