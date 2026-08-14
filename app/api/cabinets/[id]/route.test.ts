import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { buildSelectChain } from "@/lib/test-utils"

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    execute: vi.fn(),
    select: vi.fn(),
    query: {
      cabinets: { findFirst: vi.fn() },
      slots: { findMany: vi.fn() },
    },
  },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { GET } from "./route"

const cabinet = {
  id: "CB-001",
  code: "CB-001",
  branch: "Jakarta",
  status: "ONLINE",
  totalSlots: 12,
  lastHeartbeat: null,
}
const slotsData = [
  { id: "s1", cabinetId: "CB-001", slotNumber: 1, state: "FULL", soc: 90 },
  { id: "s2", cabinetId: "CB-001", slotNumber: 2, state: "EMPTY", soc: null },
]
const history = [
  {
    id: "tx-1",
    cabinetId: "CB-001",
    userId: "U-1",
    oldBatteryId: "B-1",
    newBatteryId: "B-2",
    swappedAt: new Date("2026-08-14T10:00:00Z"),
  },
]

describe("GET /api/cabinets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return cabinet detail with slots, history and 24h chart", async () => {
    dbMock.query.cabinets.findFirst.mockResolvedValue(cabinet)
    dbMock.query.slots.findMany.mockResolvedValue(slotsData)
    dbMock.select.mockReturnValue(buildSelectChain(history))
    dbMock.execute.mockResolvedValue({ rows: [{ hour: "10:00", count: 3 }] })

    const res = await GET(new NextRequest("http://localhost/api/cabinets/CB-001"))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.id).toBe("CB-001")
    expect(body.slots).toHaveLength(2)
    expect(body.swapHistory).toHaveLength(1)
    expect(body.chartData).toHaveLength(24)
    const hour = body.chartData.find((c: { hour: string }) => c.hour === "10:00")
    expect(hour.count).toBe(3)
  })

  it("should return 404 when cabinet not found", async () => {
    dbMock.query.cabinets.findFirst.mockResolvedValue(null)
    const res = await GET(new NextRequest("http://localhost/api/cabinets/NOPE-999"))
    expect(res.status).toBe(404)
  })

  it("should return 500 on db error", async () => {
    dbMock.query.cabinets.findFirst.mockRejectedValue(new Error("db down"))
    const res = await GET(new NextRequest("http://localhost/api/cabinets/CB-001"))
    expect(res.status).toBe(500)
  })
})
