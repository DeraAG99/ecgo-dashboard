import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { buildSelectChain } from "@/lib/test-utils"

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    execute: vi.fn(),
    select: vi.fn(),
    query: {
      batteries: { findFirst: vi.fn() },
    },
  },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { GET } from "./route"

const battery = {
  id: "bat-0001",
  batteryCode: "BATT-ABCD1234",
  status: "AVAILABLE",
  cycleCount: 120,
  health: 85,
  cabinetId: "CB-001",
  cabinet: { id: "CB-001", code: "CB-001", branch: "Kemayoran" },
  lastSwapAt: new Date("2026-08-14T10:00:00Z"),
  createdAt: new Date("2026-02-01T00:00:00Z"),
}

const history = [
  {
    id: "tx-1",
    userId: "U-1",
    oldBatteryId: "BATT-OLD1234",
    newBatteryId: "BATT-ABCD1234",
    cabinetId: "CB-001",
    cabinetCode: "CB-001",
    branch: "Kemayoran",
    swappedAt: new Date("2026-08-14T10:00:00Z"),
  },
]

describe("GET /api/batteries/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return battery detail with swap history", async () => {
    dbMock.query.batteries.findFirst.mockResolvedValue(battery)
    dbMock.select.mockReturnValue(buildSelectChain(history))

    const res = await GET(new NextRequest("http://localhost/api/batteries/bat-0001"))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.battery.batteryCode).toBe("BATT-ABCD1234")
    expect(body.battery.cabinet.branch).toBe("Kemayoran")
    expect(body.history).toHaveLength(1)
  })

  it("should return 404 when battery not found", async () => {
    dbMock.query.batteries.findFirst.mockResolvedValue(null)
    const res = await GET(new NextRequest("http://localhost/api/batteries/NOPE"))
    expect(res.status).toBe(404)
  })

  it("should return 500 on db error", async () => {
    dbMock.query.batteries.findFirst.mockRejectedValue(new Error("db down"))
    const res = await GET(new NextRequest("http://localhost/api/batteries/bat-0001"))
    expect(res.status).toBe(500)
  })
})
