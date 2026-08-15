import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { buildSelectChain } from "@/lib/test-utils"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { execute: vi.fn(), select: vi.fn(), query: {} },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { GET } from "./route"

const txRow = {
  id: "tx-1",
  cabinetId: "CB-001",
  cabinetCode: "CB-001",
  branch: "Jakarta",
  userId: "U-1",
  oldBatteryId: "B-1",
  newBatteryId: "B-2",
  swappedAt: new Date("2026-08-14T10:00:00Z"),
}

describe("GET /api/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return transactions with total", async () => {
    dbMock.select
      .mockReturnValueOnce(buildSelectChain([txRow]))
      .mockReturnValueOnce(buildSelectChain([{ total: 5 }]))

    const res = await GET(new NextRequest("http://localhost/api/transactions?limit=2"))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].cabinetCode).toBe("CB-001")
    expect(body.total).toBe(5)
    expect(body.totalPages).toBe(3)
  })

  it("should filter by cabinetId", async () => {
    dbMock.select.mockReturnValue(buildSelectChain([]))
    await GET(new NextRequest("http://localhost/api/transactions?cabinetId=CB-002"))
    expect(dbMock.select).toHaveBeenCalledTimes(2)
  })

  it("should accept startDate and endDate filters", async () => {
    dbMock.select.mockReturnValue(buildSelectChain([]))
    const res = await GET(
      new NextRequest(
        "http://localhost/api/transactions?startDate=2026-08-01&endDate=2026-08-15"
      )
    )
    expect(res.status).toBe(200)
    expect(dbMock.select).toHaveBeenCalledTimes(2)
  })

  it("should return 400 for invalid date filter", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/transactions?startDate=not-a-date")
    )
    expect(res.status).toBe(400)
    expect(dbMock.select).not.toHaveBeenCalled()
  })

  it("should return 400 for negative limit", async () => {
    const res = await GET(new NextRequest("http://localhost/api/transactions?limit=-1"))
    expect(res.status).toBe(400)
  })

  it("should return 500 on db error", async () => {
    dbMock.select.mockImplementationOnce(() => {
      throw new Error("db down")
    })
    const res = await GET(new NextRequest("http://localhost/api/transactions"))
    expect(res.status).toBe(500)
  })
})
