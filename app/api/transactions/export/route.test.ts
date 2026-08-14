import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { buildSelectChain } from "@/lib/test-utils"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { execute: vi.fn(), select: vi.fn(), query: {} },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { GET } from "./route"

describe("GET /api/transactions/export", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return CSV with header and rows", async () => {
    dbMock.select.mockReturnValue(
      buildSelectChain([
        {
          id: "tx-1",
          cabinetCode: "CB-001",
          branch: "Jakarta",
          userId: "U-1",
          oldBatteryId: "B-1",
          newBatteryId: "B-2",
          swappedAt: new Date("2026-08-14T10:00:00Z"),
        },
      ])
    )

    const res = await GET(new NextRequest("http://localhost/api/transactions/export"))
    expect(res.headers.get("Content-Type")).toContain("text/csv")

    const text = await res.text()
    const lines = text.split("\r\n")
    expect(lines[0]).toContain("id,cabinetCode,branch,userId")
    expect(lines[1]).toContain('"tx-1"')
    expect(lines[1]).toContain('"CB-001"')
  })

  it("should return 500 on db error", async () => {
    dbMock.select.mockImplementationOnce(() => {
      throw new Error("db down")
    })
    const res = await GET(new NextRequest("http://localhost/api/transactions/export"))
    expect(res.status).toBe(500)
  })
})
