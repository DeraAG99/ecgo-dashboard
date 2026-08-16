import { describe, it, expect, vi, beforeEach } from "vitest"

const { dbMock, addMaintenanceLogMock } = vi.hoisted(() => ({
  dbMock: { insert: vi.fn(), query: { alerts: { findFirst: vi.fn() } } },
  addMaintenanceLogMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("./log", () => ({ addMaintenanceLog: addMaintenanceLogMock }))

import { mapAlertPriority, createWorkOrderFromAlert } from "./createFromAlert"

describe("mapAlertPriority", () => {
  it("should map severity to work order priority", () => {
    expect(mapAlertPriority("CRITICAL")).toBe("HIGH")
    expect(mapAlertPriority("WARNING")).toBe("MEDIUM")
    expect(mapAlertPriority("INFO")).toBe("LOW")
  })
})

describe("createWorkOrderFromAlert", () => {
  const alert = {
    id: "al-1",
    type: "CABINET_OFFLINE",
    severity: "CRITICAL",
    title: "Cabinet offline",
    message: "CB-001 tidak terhubung",
    entityId: "CB-001",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    addMaintenanceLogMock.mockResolvedValue(undefined)
    dbMock.insert.mockReturnValue({ values: vi.fn().mockResolvedValue([]) })
  })

  it("should create work order from alert and log it", async () => {
    dbMock.query.alerts.findFirst.mockResolvedValue(alert)
    const insertValues = vi.fn().mockResolvedValue([])
    dbMock.insert.mockReturnValue({ values: insertValues })

    const row = await createWorkOrderFromAlert("al-1")

    expect(row.id).toMatch(/^wo-/)
    expect(row.alertId).toBe("al-1")
    expect(row.entityType).toBe("CABINET")
    expect(row.entityId).toBe("CB-001")
    expect(row.priority).toBe("HIGH")
    expect(row.status).toBe("OPEN")
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ entityId: "CB-001" }))
    expect(addMaintenanceLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "WO_CREATED_FROM_ALERT", entityId: "CB-001" })
    )
  })

  it("should throw when alert not found", async () => {
    dbMock.query.alerts.findFirst.mockResolvedValue(undefined)

    await expect(createWorkOrderFromAlert("al-x")).rejects.toThrow("Alert not found")
  })

  it("should throw when alert has no entity id", async () => {
    dbMock.query.alerts.findFirst.mockResolvedValue({ ...alert, entityId: null })

    await expect(createWorkOrderFromAlert("al-1")).rejects.toThrow("Alert has no entity id")
  })
})
