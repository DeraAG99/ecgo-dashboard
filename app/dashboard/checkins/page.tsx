"use client"

import { useCallback, useEffect, useState } from "react"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"
import { haversine } from "@/lib/checkin/evaluateCheckin"
import { formatJakarta } from "@/lib/time"

interface CabinetOption {
  id: string
  code: string
  branch: string
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE"
  lat: number | null
  lng: number | null
  radiusM: number | null
}

interface CheckInResult {
  status: "VALID" | "OUT_OF_RANGE" | "REJECTED"
  branchId?: string | null
  branchName?: string | null
  distanceM?: number | null
  reason?: string | null
}

interface CheckInRecord {
  id: string
  userId: string
  lat: number
  lng: number
  accuracyM: number
  result: "VALID" | "OUT_OF_RANGE" | "REJECTED"
  reason: string | null
  distanceM: number | null
  createdAt: string
  branch: { id: string; code: string; name: string } | null
}

interface SwapResponse {
  transaction: {
    id: string
    cabinetId: string
    userId: string
    oldBatteryId: string
    newBatteryId: string
    swappedAt: string
  }
  slotChanges: { slotNumber: number; from: string; to: string }[]
}

function ResultBadge({ status }: { status: CheckInResult["status"] }) {
  const styles: Record<CheckInResult["status"], string> = {
    VALID: "bg-ecgo-green/10 text-ecgo-green",
    OUT_OF_RANGE: "bg-amber-500/10 text-amber-700",
    REJECTED: "bg-error/10 text-error",
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-label-caps px-2 py-1 rounded ${styles[status]}`}
    >
      {status}
    </span>
  )
}

export default function CheckInsPage() {
  const [cabinets, setCabinets] = useState<CabinetOption[]>([])
  const [targetId, setTargetId] = useState("")
  const [userId, setUserId] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [accuracyM, setAccuracyM] = useState("15")

  const [cabError, setCabError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [result, setResult] = useState<CheckInResult | null>(null)

  const [swapping, setSwapping] = useState(false)
  const [swapError, setSwapError] = useState<string | null>(null)
  const [swapResult, setSwapResult] = useState<SwapResponse | null>(null)

  const [history, setHistory] = useState<CheckInRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const target = cabinets.find((c) => c.id === targetId) || null

  const loadCabinets = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/cabinets?limit=100")
      if (!res.ok) throw new Error("Gagal memuat cabinet")
      const data = await res.json()
      setCabinets(data.data)
    } catch (err) {
      setCabError(err instanceof Error ? err.message : "Terjadi kesalahan")
    }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/checkins?limit=20")
      if (!res.ok) throw new Error("Gagal memuat riwayat check-in")
      const data = await res.json()
      setHistory(data.data)
    } catch (err) {
      setCabError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCabinets()
    loadHistory()
  }, [loadCabinets, loadHistory])

  const selectTarget = (id: string) => {
    setTargetId(id)
    setResult(null)
    setSwapResult(null)
    const cab = cabinets.find((c) => c.id === id)
    if (cab?.lat != null && cab?.lng != null) {
      setLat(String(cab.lat))
      setLng(String(cab.lng))
    }
  }

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setCheckInError("Browser tidak mendukung geolocation")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude))
        setLng(String(pos.coords.longitude))
      },
      () => setCheckInError("Gagal mengambil lokasi GPS")
    )
  }

  const doCheckIn = async () => {
    if (!userId.trim()) {
      setCheckInError("Isi User ID dulu")
      return
    }
    setChecking(true)
    setCheckInError(null)
    setResult(null)
    setSwapResult(null)
    try {
      const res = await fetch("/api/dashboard/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          lat: Number(lat),
          lng: Number(lng),
          accuracyM: Number(accuracyM),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ? String(data.error) : "Check-in gagal")
      }
      setResult(data.result as CheckInResult)
      setSwapResult(null)
      loadHistory()
    } catch (err) {
      setCheckInError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setChecking(false)
    }
  }

  const doSwap = async () => {
    if (!targetId) return
    setSwapping(true)
    setSwapError(null)
    setSwapResult(null)
    try {
      const res = await fetch("/api/dashboard/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim(), cabinetId: targetId }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Swap gagal"
        )
      }
      setSwapResult(data as SwapResponse)
      loadHistory()
    } catch (err) {
      setSwapError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSwapping(false)
    }
  }

  const latNum = Number(lat)
  const lngNum = Number(lng)
  const distance =
    target?.lat != null && target?.lng != null && !Number.isNaN(latNum) && !Number.isNaN(lngNum)
      ? Math.round(haversine(latNum, lngNum, target.lat, target.lng))
      : null

  if (cabError && cabinets.length === 0) return <ErrorMessage message={cabError} />

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-display text-on-surface">Check-in</h2>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Verifikasi lokasi staf/user terhadap radius cabang, lalu lanjutkan swap baterai.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 card p-6">
          <h3 className="font-headline-md text-ecgo-blue mb-4">1. Demo Check-in</h3>

          <label className="block text-label-caps text-on-surface-variant uppercase mb-1">
            Cabinet Target
          </label>
          <select
            value={targetId}
            onChange={(e) => selectTarget(e.target.value)}
            className="w-full mb-3 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Pilih cabinet target...</option>
            {cabinets.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.branch} (radius {c.radiusM ?? "-"}m)
              </option>
            ))}
          </select>

          {target && (
            <div className="text-body-xs text-on-surface-variant mb-3 space-y-1">
              <p>
                Koordinat cabinet:{" "}
                <span className="font-mono">
                  {target.lat?.toFixed(5)}, {target.lng?.toFixed(5)}
                </span>
              </p>
              <p>
                Jarak ke target:{" "}
                <span className="font-mono font-medium text-on-surface">
                  {distance != null ? `${distance} m` : "-"}
                </span>{" "}
                / Radius:{" "}
                <span className="font-mono font-medium text-on-surface">
                  {target.radiusM ?? "-"} m
                </span>{" "}
                {distance != null && target.radiusM != null && (
                  <span
                    className={
                      distance <= target.radiusM
                        ? "text-ecgo-green"
                        : "text-error"
                    }
                  >
                    ({distance <= target.radiusM ? "dalam radius" : "luar radius"})
                  </span>
                )}
              </p>
            </div>
          )}

          <label className="block text-label-caps text-on-surface-variant uppercase mb-1">
            User ID
          </label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="U-1234"
            className="w-full mb-3 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-label-caps text-on-surface-variant uppercase mb-1">
                Lat
              </label>
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                inputMode="decimal"
                className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-label-caps text-on-surface-variant uppercase mb-1">
                Lng
              </label>
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                inputMode="decimal"
                className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <label className="block text-label-caps text-on-surface-variant uppercase mb-1">
            Akurasi GPS (m)
          </label>
          <input
            value={accuracyM}
            onChange={(e) => setAccuracyM(e.target.value)}
            inputMode="numeric"
            className="w-full mb-4 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="flex flex-col gap-2">
            <button
              onClick={doCheckIn}
              disabled={checking}
              className="px-4 py-2 bg-ecgo-green text-white rounded-lg text-body-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {checking ? "Memeriksa..." : "Check-in"}
            </button>
            <button
              onClick={() => {
                if (target?.lat != null && target?.lng != null) {
                  setLat(String(target.lat))
                  setLng(String(target.lng))
                }
              }}
              disabled={!target}
              className="px-4 py-2 bg-surface-container rounded-lg text-body-sm font-medium hover:bg-surface-variant border border-outline-variant disabled:opacity-50"
            >
              Reset ke koordinat cabinet
            </button>
            <button
              onClick={useMyLocation}
              className="px-4 py-2 bg-surface-container rounded-lg text-body-sm font-medium hover:bg-surface-variant border border-outline-variant"
            >
              Pakai Lokasi Saya (GPS)
            </button>
          </div>

          {checkInError && (
            <p className="mt-4 text-body-sm text-error">{checkInError}</p>
          )}

          {result && (
            <div className="mt-4 p-4 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <ResultBadge status={result.status} />
              </div>
              {result.status === "VALID" && (
                <p className="text-body-sm text-on-surface">
                  Lokasi valid di <span className="font-medium">{result.branchName}</span> — jarak{" "}
                  <span className="font-mono">{result.distanceM} m</span>
                </p>
              )}
              {result.status === "OUT_OF_RANGE" && (
                <p className="text-body-sm text-on-surface">
                  Di luar semua radius. Cabang terdekat:{" "}
                  <span className="font-medium">{result.branchName ?? "tidak ada"}</span>
                  {result.distanceM != null && (
                    <span className="font-mono"> ({result.distanceM} m)</span>
                  )}
                </p>
              )}
              {result.status === "REJECTED" && (
                <p className="text-body-sm text-on-surface">
                  Ditolak: <span className="font-mono">{result.reason}</span>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 card p-6">
          <h3 className="font-headline-md text-ecgo-blue mb-4">2. Swap Baterai</h3>
          {result?.status !== "VALID" ? (
            <div className="py-10 text-center text-on-surface-variant">
              Check-in harus <span className="text-ecgo-green font-medium">VALID</span>{" "}
              dulu sebelum bisa swap.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-body-sm text-on-surface">
                Check-in valid di{" "}
                <span className="font-medium">{result.branchName}</span>. Lanjutkan swap
                di cabinet{" "}
                <span className="font-mono font-medium">
                  {target ? `${target.code} (${target.branch})` : targetId}
                </span>
                ?
              </p>
              <button
                onClick={doSwap}
                disabled={swapping}
                className="px-4 py-2 bg-ecgo-blue text-white rounded-lg text-body-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                {swapping ? "Swap berlangsung..." : "Lakukan Swap"}
              </button>

              {swapError && <p className="text-body-sm text-error">{swapError}</p>}

              {swapResult && (
                <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-1">
                  <p className="text-body-sm text-on-surface font-medium">Swap berhasil!</p>
                  <p className="font-mono text-data-mono text-on-surface">
                    Tx: {swapResult.transaction.id}
                  </p>
                  <p className="text-body-sm text-on-surface">
                    Baterai lama: <span className="font-mono">{swapResult.transaction.oldBatteryId}</span>{" "}
                    → baru: <span className="font-mono">{swapResult.transaction.newBatteryId}</span>
                  </p>
                  {swapResult.slotChanges.length > 0 && (
                    <p className="text-body-sm text-on-surface-variant">
                      Slot berubah:{" "}
                      {swapResult.slotChanges
                        .map((s) => `#${s.slotNumber} ${s.from}→${s.to}`)
                        .join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6 overflow-hidden">
        <h3 className="font-headline-md text-ecgo-blue mb-4">Riwayat Check-in</h3>
        {historyLoading ? (
          <LoadingSpinner />
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-on-surface-variant">
            Belum ada riwayat check-in
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-outline-variant/30">
                  <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">Waktu</th>
                  <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">User</th>
                  <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">Hasil</th>
                  <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">Cabang</th>
                  <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider">Akurasi</th>
                  <th className="py-3 px-4 text-label-caps text-ecgo-blue/80 uppercase tracking-wider text-right">Jarak</th>
                </tr>
              </thead>
              <tbody className="font-mono text-data-mono text-on-surface">
                {history.map((ci) => (
                  <tr key={ci.id} className="border-b border-outline-variant/20">
                    <td className="py-3 px-4 text-on-surface-variant">
                      {formatJakarta(ci.createdAt)}
                    </td>
                    <td className="py-3 px-4">{ci.userId}</td>
                    <td className="py-3 px-4">
                      <ResultBadge status={ci.result} />
                      {ci.reason && (
                        <span className="text-body-xs text-on-surface-variant ml-2">
                          {ci.reason}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {ci.branch ? `${ci.branch.name} (${ci.branch.code})` : "-"}
                    </td>
                    <td className="py-3 px-4">{ci.accuracyM} m</td>
                    <td className="py-3 px-4 text-right">
                      {ci.distanceM != null ? `${ci.distanceM} m` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
