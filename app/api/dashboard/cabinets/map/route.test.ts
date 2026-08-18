import { describe, it, expect, vi, beforeEach } from "vitest"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { execute: vi.fn() },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { GET } from "./route"

describe("GET /api/dashboard/cabinets/map", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return all cabinets with coordinates and aggregates", async () => {
    dbMock.execute.mockResolvedValue({
      rows: [
        {
          id: "CB-001",
          code: "CB-001",
          branch: "Kemayoran",
          status: "ONLINE",
          totalSlots: 12,
          filledSlots: 6,
          swapCount24h: 14,
          lastHeartbeat: new Date("2026-08-14T10:00:00Z"),
          lat: -6.2,
          lng: 106.82,
          radiusM: 150,
        },
      ],
    })

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].code).toBe("CB-001")
    expect(body.data[0].lat).toBe(-6.2)
    expect(body.data[0].filledSlots).toBe(6)
    expect(dbMock.execute).toHaveBeenCalledTimes(1)
  })

  it("should return 500 on db error", async () => {
    dbMock.execute.mockRejectedValue(new Error("db down"))
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it("should return empty array when no cabinets", async () => {
    dbMock.execute.mockResolvedValue({ rows: [] })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(0)
  })
})
