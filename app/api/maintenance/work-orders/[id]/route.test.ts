import { describe, it, expect, vi, beforeEach } from "vitest"

const { dbMock, addMaintenanceLogMock, resolveEntityMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), update: vi.fn() },
  addMaintenanceLogMock: vi.fn().mockResolvedValue(undefined),
  resolveEntityMock: vi.fn().mockResolvedValue({ entityType: "CABINET", entityId: "CB-001", entityLabel: "CB-001" }),
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/maintenance/log", () => ({ addMaintenanceLog: addMaintenanceLogMock }))
vi.mock("@/lib/maintenance/entities", () => ({ resolveEntityForLog: resolveEntityMock }))

import { PATCH } from "./route"

const woRow = {
  id: "wo-1",
  alertId: "al-1",
  entityType: "CABINET",
  entityId: "CB-001",
  title: "Test WO",
  status: "OPEN",
  assignedTo: null,
}

const chain = (returned: unknown[] = []) => ({
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue(returned),
})

describe("PATCH /api/maintenance/work-orders/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    addMaintenanceLogMock.mockResolvedValue(undefined)
    resolveEntityMock.mockResolvedValue({ entityType: "CABINET", entityId: "CB-001", entityLabel: "CB-001" })
  })

  it("should return 404 for missing work order", async () => {
    dbMock.select.mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
    } as never)
    const req = new Request("http://localhost", { method: "PATCH", body: JSON.stringify({}) })
    const res = await PATCH(req as never, { params: Promise.resolve({ id: "wo-x" }) })
    expect(res.status).toBe(404)
  })

  it("should resolve linked alert when status -> DONE", async () => {
    dbMock.select.mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([woRow]) }) }),
    } as never)
    const updateWo = chain([{ ...woRow, status: "DONE", completedAt: new Date() }])
    dbMock.update.mockReturnValueOnce(chain([])).mockReturnValueOnce(updateWo)

    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ status: "DONE" }) }) as never,
      { params: Promise.resolve({ id: "wo-1" }) }
    )
    expect(res.status).toBe(200)
    expect(dbMock.update).toHaveBeenCalledTimes(2)
  })

  it("should return 400 for invalid status", async () => {
    dbMock.select.mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([woRow]) }) }),
    } as never)
    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ status: "INVALID" }) }) as never,
      { params: Promise.resolve({ id: "wo-1" }) }
    )
    expect(res.status).toBe(400)
  })
})
