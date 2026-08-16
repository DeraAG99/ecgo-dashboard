import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { buildSelectChain } from "@/lib/test-utils"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { execute: vi.fn(), select: vi.fn(), query: {} },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { GET } from "./route"

const batteryRow = {
  id: "bat-0001",
  batteryCode: "BATT-ABCD1234",
  status: "AVAILABLE",
  cycleCount: 120,
  health: 85,
  cabinetId: "CB-001",
  cabinetCode: "CB-001",
  branch: "Kemayoran",
  lastSwapAt: new Date("2026-08-14T10:00:00Z"),
  createdAt: new Date("2026-02-01T00:00:00Z"),
}

describe("GET /api/batteries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return paginated battery list", async () => {
    dbMock.select
      .mockReturnValueOnce(buildSelectChain([batteryRow]))
      .mockReturnValueOnce(buildSelectChain([{ total: 1 }]))

    const res = await GET(new NextRequest("http://localhost/api/batteries?limit=20"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].batteryCode).toBe("BATT-ABCD1234")
    expect(body.data[0].health).toBe(85)
    expect(body.total).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it("should apply status and minHealth filters", async () => {
    dbMock.select.mockReturnValue(buildSelectChain([]))
    const res = await GET(
      new NextRequest("http://localhost/api/batteries?status=RETIRED&minHealth=20")
    )
    expect(res.status).toBe(200)
    expect(dbMock.select).toHaveBeenCalledTimes(2)
  })

  it("should return 400 for invalid status", async () => {
    const res = await GET(new NextRequest("http://localhost/api/batteries?status=INVALID"))
    expect(res.status).toBe(400)
    expect(dbMock.select).not.toHaveBeenCalled()
  })

  it("should return 400 for invalid minHealth range", async () => {
    const res = await GET(new NextRequest("http://localhost/api/batteries?minHealth=150"))
    expect(res.status).toBe(400)
  })

  it("should return 500 on db error", async () => {
    dbMock.select.mockImplementationOnce(() => {
      throw new Error("db down")
    })
    const res = await GET(new NextRequest("http://localhost/api/batteries"))
    expect(res.status).toBe(500)
  })
})
