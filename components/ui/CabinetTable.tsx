"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { debounce } from "lodash"
import { Cabinet } from "@/lib/schema"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import ErrorMessage from "@/components/shared/ErrorMessage"

interface CabinetTableRow extends Cabinet {
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE"
  filledSlots: number
  totalSlots: number
  swapCount24h: number
  lastHeartbeat: Date | null
}

export default function CabinetTable() {
  const [cabinets, setCabinets] = useState<CabinetTableRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)

  const searchParams = useSearchParams()
  const router = useRouter()

  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""
  const sortBy = (searchParams.get("sortBy") as any) || "swapCount24h"
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  const limit = 10

  const fetchCabinets = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (status) params.set("status", status)
      params.set("page", String(page))
      params.set("limit", String(limit))
      params.set("sortBy", sortBy)
      params.set("sortOrder", sortOrder)

      const response = await fetch(`/api/cabinets?${params.toString()}`)

      if (!response.ok) throw new Error("Failed to fetch cabinets")

      const data = await response.json()
      setCabinets(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCabinets()
  }, [search, status, page, sortBy, sortOrder])

  const debouncedSearch = debounce((value: string) => {
    setPage(1)
    const params = new URLSearchParams()
    if (value) params.set("search", value)
    if (status) params.set("status", status)
    params.set("sortBy", sortBy)
    params.set("sortOrder", sortOrder)
    router.push(`/cabins?${params.toString()}`)
  }, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value)
  }

  const handleStatusFilter = (value: string) => {
    setPage(1)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (value) params.set("status", value)
    params.set("sortBy", sortBy)
    params.set("sortOrder", sortOrder)
    router.push(`/cabins?${params.toString()}`)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div>
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Cari cabinet atau cabang..."
          defaultValue={search}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={handleSearchChange}
        />
        <select
          defaultValue={status}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Status</option>
          <option value="ONLINE">ONLINE</option>
          <option value="OFFLINE">OFFLINE</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3 text-left font-semibold">Code</th>
              <th className="px-4 py-3 text-left font-semibold">Branch</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-center font-semibold">Filled/Total</th>
              <th className="px-4 py-3 text-center font-semibold">Swap 24h</th>
              <th className="px-4 py-3 text-center font-semibold">Last Heartbeat</th>
            </tr>
          </thead>
          <tbody>
            {cabinets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              cabinets.map((cabinet) => (
                <tr key={cabinet.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">{cabinet.code}</td>
                  <td className="px-4 py-3">{cabinet.branch}</td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 text-center">
                    {cabinet.filledSlots}/{cabinet.totalSlots}
                  </td>
                  <td className="px-4 py-3 text-center">{cabinet.swapCount24h}</td>
                  <td className="px-4 py-3 text-center">
                    {cabinet.lastHeartbeat
                      ? new Date(cabinet.lastHeartbeat).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Menampilkan {cabinets.length} dari {total} cabinets
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}