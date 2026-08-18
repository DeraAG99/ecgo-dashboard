import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { execute: vi.fn(), select: vi.fn(), query: {} },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { GET } from "./route"

const row = {
  id: "CB-001",
  code: "CB-001",
  branch: "Jakarta",
  status: "ONLINE",
  totalSlots: 12,
  lastHeartbeat: null,
  filledSlots: 4,
  swapCount24h: 22,
  _total: 1,
}

describe("GET /api/dashboard/cabinets", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return paginated cabinet list", async () => {
    dbMock.execute.mockResolvedValue({ rows: [row] })

    const res = await GET(new NextRequest("http://localhost/api/dashboard/cabinets"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].code).toBe("CB-001")
    expect(body.data[0].swapCount24h).toBe(22)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it("should return 400 for invalid status", async () => {
    const res = await GET(new NextRequest("http://localhost/api/dashboard/cabinets?status=INVALID"))
    expect(res.status).toBe(400)
    expect(dbMock.execute).not.toHaveBeenCalled()
  })

  it("should apply search, status, sort to the query", async () => {
    dbMock.execute.mockResolvedValue({ rows: [] })

    await GET(
      new NextRequest(
        "http://localhost/api/dashboard/cabinets?search=CB&status=ONLINE&sortBy=code&sortOrder=asc&page=2&limit=5"
      )
    )
    expect(dbMock.execute).toHaveBeenCalledTimes(1)
    expect(dbMock.execute.mock.calls[0].length).toBe(1)
  })

  it("should return 500 on unexpected error", async () => {
    dbMock.execute.mockRejectedValue(new Error("db down"))
    const res = await GET(new NextRequest("http://localhost/api/dashboard/cabinets"))
    expect(res.status).toBe(500)
  })
})
