import { describe, it, expect, vi, beforeEach } from "vitest"
import { buildSelectChain } from "@/lib/test-utils"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn() },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { resolveEntityForLog } from "./entities"

describe("resolveEntityForLog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should resolve cabinet label", async () => {
    dbMock.select.mockReturnValueOnce(buildSelectChain([{ code: "CB-001" }]))
    const result = await resolveEntityForLog({ entityType: "CABINET", entityId: "CB-001" })

    expect(result).toEqual({ entityType: "CABINET", entityId: "CB-001", entityLabel: "CB-001" })
  })

  it("should resolve slot label with cabinet code", async () => {
    dbMock.select
      .mockReturnValueOnce(buildSelectChain([{ cabinetId: "CB-001", slotNumber: 3 }]))
      .mockReturnValueOnce(buildSelectChain([{ code: "CB-001" }]))
    const result = await resolveEntityForLog({ entityType: "SLOT", entityId: "slot-1" })

    expect(result.entityLabel).toBe("CB-001 Slot #3")
  })

  it("should fall back to cabinet id when cabinet code missing for slot", async () => {
    dbMock.select
      .mockReturnValueOnce(buildSelectChain([{ cabinetId: "CB-009", slotNumber: 7 }]))
      .mockReturnValueOnce(buildSelectChain([]))
    const result = await resolveEntityForLog({ entityType: "SLOT", entityId: "slot-2" })

    expect(result.entityLabel).toBe("CB-009 Slot #7")
  })

  it("should return undefined label when slot not found", async () => {
    dbMock.select.mockReturnValueOnce(buildSelectChain([]))
    const result = await resolveEntityForLog({ entityType: "SLOT", entityId: "missing" })

    expect(result.entityLabel).toBeUndefined()
  })

  it("should resolve battery label", async () => {
    dbMock.select.mockReturnValueOnce(buildSelectChain([{ batteryCode: "BATT-001" }]))
    const result = await resolveEntityForLog({ entityType: "BATTERY", entityId: "b-1" })

    expect(result).toEqual({ entityType: "BATTERY", entityId: "b-1", entityLabel: "BATT-001" })
  })

  it("should return undefined label for unknown entity type", async () => {
    const result = await resolveEntityForLog({ entityType: "WORK_ORDER", entityId: "wo-1" })

    expect(result).toEqual({ entityType: "WORK_ORDER", entityId: "wo-1", entityLabel: undefined })
  })
})
