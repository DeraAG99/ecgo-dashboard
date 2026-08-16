import { describe, it, expect, vi, beforeEach } from "vitest"
import { buildSelectChain } from "@/lib/test-utils"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), execute: vi.fn() },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { GET } from "./route"

describe("GET /api/maintenance/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should aggregate health summary", async () => {
    dbMock.select
      .mockReturnValueOnce(buildSelectChain([
        { status: "ONLINE", count: 2 },
        { status: "MAINTENANCE", count: 1 },
      ]))
      .mockReturnValueOnce(buildSelectChain([
        { state: "FAULT", count: 1 },
        { state: "LOCKED", count: 2 },
        { state: "FULL", count: 3 },
      ]))
      .mockReturnValueOnce(buildSelectChain([{ status: "RETIRED", count: 1 }]))
      .mockReturnValueOnce(buildSelectChain([{ count: 2 }]))
      .mockReturnValueOnce(buildSelectChain([{ status: "OPEN", count: 4 }]))
      .mockReturnValueOnce(buildSelectChain([{ count: 6 }]))
      .mockReturnValueOnce(buildSelectChain([{ count: 4 }]))
      .mockReturnValueOnce(buildSelectChain([{ count: 1 }]))
      .mockReturnValueOnce(buildSelectChain([{ count: 2 }]))
    dbMock.execute.mockResolvedValue({
      rows: [
        { bucket: "0-19", count: 2 },
        { bucket: "80-100", count: 5 },
      ],
    })

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cabinets).toEqual({ ONLINE: 2, OFFLINE: 0, MAINTENANCE: 1 })
    expect(body.slots.FAULT).toBe(1)
    expect(body.slots.LOCKED).toBe(2)
    expect(body.slotFaultCount).toBe(1)
    expect(body.slotLockedCount).toBe(2)
    expect(body.batteries).toEqual({ AVAILABLE: 0, IN_USE: 0, CHARGING: 0, FAULT: 0, RETIRED: 1 })
    expect(body.batteryLowHealthCount).toBe(2)
    expect(body.batteryHealthBuckets["0-19"]).toBe(2)
    expect(body.batteryHealthBuckets["80-100"]).toBe(5)
    expect(body.alerts.unresolved).toBe(6)
    expect(body.workOrders.byStatus.OPEN).toBe(4)
    expect(body.workOrders.openCount).toBe(4)
  })

  it("should return 500 on db error", async () => {
    dbMock.select.mockReturnValueOnce({
      then: () => {
        throw new Error("db down")
      },
    })
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
