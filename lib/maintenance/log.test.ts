import { describe, it, expect, vi, beforeEach } from "vitest"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { insert: vi.fn() },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { addMaintenanceLog } from "./log"

describe("addMaintenanceLog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMock.insert.mockReturnValue({ values: vi.fn().mockResolvedValue([]) })
  })

  it("should insert a log row with defaults for optional fields", async () => {
    const row = await addMaintenanceLog({ action: "CABINET_ONLINE", entityType: "CABINET", entityId: "CB-001" })

    expect(row.id).toMatch(/^ml-/)
    expect(row.action).toBe("CABINET_ONLINE")
    expect(row.entityType).toBe("CABINET")
    expect(row.entityId).toBe("CB-001")
    expect(row.entityLabel).toBeNull()
    expect(row.detail).toBeNull()
    expect(dbMock.insert).toHaveBeenCalledTimes(1)
  })

  it("should pass through all provided fields", async () => {
    const row = await addMaintenanceLog({
      action: "WO_ASSIGNED",
      entityType: "WORK_ORDER",
      entityId: "wo-1",
      entityLabel: "Ganti fan",
      detail: "assignedTo=Andi",
    })

    expect(row.entityLabel).toBe("Ganti fan")
    expect(row.detail).toBe("assignedTo=Andi")
  })
})
