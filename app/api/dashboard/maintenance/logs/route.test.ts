import { describe, it, expect, vi, beforeEach } from "vitest"
import { buildSelectChain } from "@/lib/test-utils"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn() },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { GET } from "./route"

describe("GET /api/dashboard/maintenance/logs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return 400 for invalid query", async () => {
    const res = await GET(new Request("http://localhost/api/dashboard/maintenance/logs?entityType=FOO") as never)
    expect(res.status).toBe(400)
    expect(dbMock.select).not.toHaveBeenCalled()
  })

  it("should return paginated logs", async () => {
    const row = {
      id: "ml-1",
      action: "CABINET_OFFLINE",
      entityType: "CABINET",
      entityId: "CB-001",
      entityLabel: "CB-001",
      detail: "prevStatus=ONLINE",
      createdAt: new Date(),
    }
    dbMock.select
      .mockReturnValueOnce(buildSelectChain([row]))
      .mockReturnValueOnce(buildSelectChain([{ total: 3 }]))

    const res = await GET(new Request("http://localhost/api/dashboard/maintenance/logs?page=1&limit=50") as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].action).toBe("CABINET_OFFLINE")
    expect(body.total).toBe(3)
    expect(body.totalPages).toBe(1)
  })
})
