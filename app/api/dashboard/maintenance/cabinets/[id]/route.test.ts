import { describe, it, expect, vi, beforeEach } from "vitest"

const { dbMock, addMaintenanceLogMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), update: vi.fn() },
  addMaintenanceLogMock: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/maintenance/log", () => ({ addMaintenanceLog: addMaintenanceLogMock }))

import { PATCH } from "./route"

const findOne = (row: unknown) => ({
  from: () => ({ where: () => ({ limit: () => Promise.resolve(row ? [row] : []) }) }),
} as never)

const updateChain = (returned: unknown[] = []) => ({
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue(returned),
})

describe("PATCH /api/dashboard/maintenance/cabinets/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    addMaintenanceLogMock.mockResolvedValue(undefined)
  })

  it("should set cabinet status with log", async () => {
    dbMock.select.mockReturnValueOnce(findOne({ id: "CB-001", code: "CB-001", status: "ONLINE" }))
    dbMock.update.mockReturnValueOnce(updateChain([{ id: "CB-001", status: "MAINTENANCE" }]))

    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "SET_MAINTENANCE", reason: "perawatan rutin" }) }) as never,
      { params: Promise.resolve({ id: "CB-001" }) }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe("MAINTENANCE")
    expect(dbMock.update).toHaveBeenCalled()
  })

  it("should return 400 for invalid action", async () => {
    dbMock.select.mockReturnValueOnce(findOne({ id: "CB-001", code: "CB-001", status: "ONLINE" }))
    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "LOCK" }) }) as never,
      { params: Promise.resolve({ id: "CB-001" }) }
    )
    expect(res.status).toBe(400)
  })

  it("should return 404 for missing cabinet", async () => {
    dbMock.select.mockReturnValueOnce(findOne(null))
    const req = new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "SET_MAINTENANCE" }) })
    const res = await PATCH(req as never, { params: Promise.resolve({ id: "x" }) })
    expect(res.status).toBe(404)
  })
})
