"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Slot } from "@/lib/schema"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"

interface CabinetDetail {
  id: string
  code: string
  branch: string
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE"
  lastHeartbeat: Date | null
  slots: Slot[]
  swapHistory: any[]
  chartData: { hour: string; count: number }[]
}

export default function CabinetDetail() {
  const { id } = useParams<{ id: string }>()
  const [cabinet, setCabinet] = useState<CabinetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchCabinet = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/cabinets/${id}`)

        if (!response.ok) throw new Error("Cabinet not found")

        const data = await response.json()
        setCabinet(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchCabinet()
  }, [id])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!cabinet) return null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{cabinet.code}</h1>
        <p className="text-gray-600">{cabinet.branch}</p>
        <div className="mt-2 flex items-center gap-4">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              cabinet.status === "ONLINE"
                ? "bg-green-100 text-green-800"
                : cabinet.status === "OFFLINE"
                ? "bg-gray-100 text-gray-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {cabinet.status}
          </span>
          <span className="text-sm text-gray-500">
            Last Update:{" "}
            {cabinet.lastHeartbeat
              ? new Date(cabinet.lastHeartbeat).toLocaleString()
              : "Tidak ada data"}
          </span>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Slot Grid</h2>
        <SlotGrid slots={cabinet.slots} />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Swap Transactions 24 Jam Terakhir
        </h2>
        <SwapChart chartData={cabinet.chartData} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Transactions (20 Terakhir)
        </h2>
        <TransactionList transactions={cabinet.swapHistory} />
      </div>
    </div>
  )
}

function SlotGrid({ slots }: { slots: Slot[] }) {
  const getStateColor = (state: string) => {
    switch (state) {
      case "EMPTY":
        return "bg-gray-300"
      case "CHARGING":
        return "bg-blue-500"
      case "FULL":
        return "bg-green-500"
      case "LOCKED":
        return "bg-red-500"
      case "FAULT":
        return "bg-orange-500"
      default:
        return "bg-gray-300"
    }
  }

  return (
    <div className="grid grid-cols-6 gap-2">
      {Array.from({ length: 12 }, (_, i) => {
        const slot = slots.find((s) => s.slotNumber === i + 1)
        return (
          <div
            key={i + 1}
            className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center relative ${getStateColor(slot?.state || "EMPTY")}`}
          >
            <span className="text-xs text-white">{i + 1}</span>
            {slot?.state === "CHARGING" && (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            )}
            {slot?.soc && slot?.state !== "EMPTY" && (
              <span className="text-xs absolute bottom-1 text-white">{slot.soc}%</span>
            )}
            {slot?.state === "EMPTY" && (
              <span className="text-xs absolute bottom-1 text-gray-600">Empty</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SwapChart({ chartData }: { chartData: { hour: string; count: number }[] }) {
  if (typeof window === "undefined") return null

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Jumlah Swap per Jam (24 Jam Terakhir)
      </h3>
      <div className="h-48">
        <div className="flex items-end gap-2 h-full">
          {chartData.map((item) => (
            <div key={item.hour} className="flex-1 flex flex-col items-center">
              <div
                className="w-8 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${Math.max(item.count * 10, 4)}px` }}
              ></div>
              <span className="text-xs text-gray-500 mt-1">{item.hour.split(":")[0]}</span>
              <span className="text-xs font-medium text-gray-700 mt-1">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TransactionList({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-center py-4">Tidak ada riwayat transaksi</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              User ID
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Old Battery
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              New Battery
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Swapped At
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-t border-gray-200 hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">{tx.userId}</td>
              <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                {tx.oldBatteryId}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                {tx.newBatteryId}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {tx.swappedAt ? new Date(tx.swappedAt).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}