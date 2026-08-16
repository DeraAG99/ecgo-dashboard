import { describe, it, expect, vi, beforeEach } from "vitest"

const { dbMock, addMaintenanceLogMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), update: vi.fn() },
  addMaintenanceLogMock: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/maintenance/log", () => ({ addMaintenanceLog: addMaintenanceLogMock }))

import { PATCH } from "./route"

const chainedUpdate = (returned: unknown[] = []) => ({
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue(returned),
})

describe("PATCH /api/maintenance/slots/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    addMaintenanceLogMock.mockResolvedValue(undefined)
  })

  it("should reset a FAULT slot to EMPTY", async () => {
    dbMock.select
      .mockReturnValueOnce({
        from: () => ({ where: () => ({ limit: () => Promise.resolve([{ id: "s-1", cabinetId: "CB-001", slotNumber: 3, state: "FAULT" }]) }) }),
      } as never)
      .mockReturnValueOnce({
        from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
      } as never)
    dbMock.update.mockReturnValueOnce(chainedUpdate([]))

    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "RESET", reason: "clear fault" }) }) as never,
      { params: Promise.resolve({ id: "s-1" }) }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.newState).toBe("EMPTY")
  })

  it("should return 400 for invalid action", async () => {
    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "RETIRE" }) }) as never,
      { params: Promise.resolve({ id: "s-1" }) }
    )
    expect(res.status).toBe(400)
  })
})
