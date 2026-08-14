import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { execute: vi.fn(), select: vi.fn(), query: {} },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { GET } from "./route"

describe("GET /api/cabinets/export", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return CSV with header and rows", async () => {
    dbMock.execute.mockResolvedValue({
      rows: [
        {
          code: "CB-001",
          branch: "Jakarta",
          status: "ONLINE",
          totalSlots: 12,
          filledSlots: 4,
          swapCount24h: 22,
          lastHeartbeat: "2026-08-14 10:00:00",
        },
      ],
    })

    const res = await GET(new NextRequest("http://localhost/api/cabinets/export"))
    expect(res.headers.get("Content-Type")).toContain("text/csv")
    expect(res.headers.get("Content-Disposition")).toContain("filename=")

    const text = await res.text()
    const lines = text.split("\r\n")
    expect(lines[0]).toContain("code,branch,status")
    expect(lines[1]).toContain('"CB-001"')
    expect(lines[1]).toContain('"Jakarta"')
  })

  it("should filter rows by status param", async () => {
    dbMock.execute.mockResolvedValue({ rows: [] })
    await GET(new NextRequest("http://localhost/api/cabinets/export?status=OFFLINE"))
    expect(dbMock.execute).toHaveBeenCalledTimes(1)
  })

  it("should return 500 on error", async () => {
    dbMock.execute.mockRejectedValue(new Error("db down"))
    const res = await GET(new NextRequest("http://localhost/api/cabinets/export"))
    expect(res.status).toBe(500)
  })
})
