import { describe, it, expect, vi, beforeEach } from "vitest"

const { dbMock, addMaintenanceLogMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), update: vi.fn() },
  addMaintenanceLogMock: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/maintenance/log", () => ({ addMaintenanceLog: addMaintenanceLogMock }))

import { PATCH } from "./route"

describe("PATCH /api/maintenance/batteries/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    addMaintenanceLogMock.mockResolvedValue(undefined)
  })

  it("should retire a battery", async () => {
    dbMock.select.mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([{ id: "b-1", batteryCode: "BATT-001", status: "FAULT" }]) }) }),
    } as never)
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    }
    dbMock.update.mockReturnValueOnce(chain)

    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "RETIRE", reason: "low health" }) }) as never,
      { params: Promise.resolve({ id: "b-1" }) }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.newStatus).toBe("RETIRED")
  })

  it("should return 404 for missing battery", async () => {
    dbMock.select.mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
    } as never)
    const req = new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "RETIRE" }) })
    const res = await PATCH(req as never, { params: Promise.resolve({ id: "x" }) })
    expect(res.status).toBe(404)
  })
})
