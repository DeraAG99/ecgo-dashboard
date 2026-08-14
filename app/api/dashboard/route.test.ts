import { describe, it, expect, vi, beforeEach } from "vitest"
import { buildSelectChain } from "@/lib/test-utils"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { execute: vi.fn(), select: vi.fn(), query: {} },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { GET } from "./route"

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should aggregate dashboard stats", async () => {
    dbMock.select
      .mockReturnValueOnce(buildSelectChain([{ status: "ONLINE", count: "40" }]))
      .mockReturnValueOnce(buildSelectChain([{ state: "FULL", count: "200" }]))
      .mockReturnValueOnce(buildSelectChain([{ total: "100" }]))
      .mockReturnValueOnce(buildSelectChain([{ day: "2026-08-14", total: "10" }]))
      .mockReturnValueOnce(
        buildSelectChain([
          { id: "CB-002", code: "CB-002", branch: "Bandung", status: "OFFLINE", lastHeartbeat: null },
        ])
      )

    const res = await GET()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.totalCabinets).toBe(40)
    expect(body.onlineCabinets).toBe(40)
    expect(body.batteriesAvailable).toBe(200)
    expect(body.totalSwapToday).toBe(100)
    expect(body.alerts).toHaveLength(1)
    expect(body.alerts[0].status).toBe("OFFLINE")
    expect(body.weeklyTrend).toHaveLength(7)
  })

  it("should return 500 on error", async () => {
    dbMock.select.mockImplementationOnce(() => {
      throw new Error("db down")
    })
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
