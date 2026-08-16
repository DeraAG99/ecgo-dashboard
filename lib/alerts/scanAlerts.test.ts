import { describe, it, expect, vi, beforeEach } from "vitest"
import { buildSelectChain } from "@/lib/test-utils"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), insert: vi.fn(), execute: vi.fn() },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { scanAlerts, severityRank } from "./scanAlerts"

const offlineCabinets = [
  { id: "CB-001", code: "CB-001", branch: "Kemayoran", status: "OFFLINE" },
  { id: "CB-002", code: "CB-002", branch: "Mangga Dua", status: "MAINTENANCE" },
]

const faultSlots = [{ id: "slot-1", cabinetId: "CB-001", slotNumber: 3, code: "CB-001" }]

const lowBatteries = [{ id: "bat-0001", batteryCode: "BATT-ABCD1234", health: 15 }]

type InsertedAlert = {
  id?: string
  type?: string
  severity?: string
  entityId?: string | null
}

function setup(opts: { existing?: unknown[]; created?: unknown[] } = {}) {
  dbMock.select
    .mockReturnValueOnce(buildSelectChain(offlineCabinets))
    .mockReturnValueOnce(buildSelectChain(faultSlots))
    .mockReturnValueOnce(buildSelectChain(lowBatteries))
    .mockReturnValueOnce(buildSelectChain(opts.existing ?? []))
    .mockReturnValueOnce(buildSelectChain(opts.created ?? []))
  dbMock.execute.mockResolvedValue({ rows: [] })
  dbMock.insert.mockReturnValue({ values: vi.fn().mockResolvedValue([]) })
}

function mockInsertCapture(): InsertedAlert[] {
  const inserted: InsertedAlert[] = []
  dbMock.insert.mockReturnValue({
    values: vi.fn().mockImplementation((values: InsertedAlert[]) => {
      inserted.push(...values)
      return []
    }),
  })
  return inserted
}

describe("scanAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should detect offline cabinet, slot fault, and low battery", async () => {
    setup()
    const inserted = mockInsertCapture()

    const result = await scanAlerts()

    expect(result.count).toBe(4)
    expect(inserted).toHaveLength(4)
    expect(inserted.map((i) => i.type).sort()).toEqual(
      ["BATTERY_LOW", "CABINET_OFFLINE", "CABINET_OFFLINE", "SLOT_FAULT"].sort()
    )
    const offline = inserted.find((i) => i.type === "CABINET_OFFLINE" && i.entityId === "CB-001")
    expect(offline?.severity).toBe("CRITICAL")
    const maintenance = inserted.find((i) => i.type === "CABINET_OFFLINE" && i.entityId === "CB-002")
    expect(maintenance?.severity).toBe("WARNING")
    const battery = inserted.find((i) => i.type === "BATTERY_LOW")
    expect(battery?.severity).toBe("CRITICAL")
  })

  it("should dedupe against existing unresolved alerts", async () => {
    setup({ existing: [{ type: "CABINET_OFFLINE", entityId: "CB-001" }] })
    const inserted = mockInsertCapture()

    const result = await scanAlerts()

    expect(result.count).toBe(3)
    expect(inserted).toHaveLength(3)
    expect(inserted.some((i) => i.type === "CABINET_OFFLINE" && i.entityId === "CB-001")).toBe(false)
  })

  it("should not insert when nothing detected", async () => {
    dbMock.select
      .mockReturnValueOnce(buildSelectChain([]))
      .mockReturnValueOnce(buildSelectChain([]))
      .mockReturnValueOnce(buildSelectChain([]))
      .mockReturnValueOnce(buildSelectChain([]))
    dbMock.execute.mockResolvedValue({ rows: [] })

    const result = await scanAlerts()

    expect(result.count).toBe(0)
    expect(dbMock.insert).not.toHaveBeenCalled()
  })

  it("should include swap anomaly from raw query rows", async () => {
    dbMock.select
      .mockReturnValueOnce(buildSelectChain([]))
      .mockReturnValueOnce(buildSelectChain([]))
      .mockReturnValueOnce(buildSelectChain([]))
      .mockReturnValueOnce(buildSelectChain([]))
      .mockReturnValueOnce(buildSelectChain([{ id: "al-x", type: "SWAP_ANOMALY", severity: "INFO" }]))
    dbMock.execute.mockResolvedValue({
      rows: [{ id: "CB-010", code: "CB-010", branch: "Ancol", swaps24h: 40, dailyAvg: 8 }],
    })
    dbMock.insert.mockReturnValue({ values: vi.fn().mockResolvedValue([]) })

    const result = await scanAlerts()

    expect(result.count).toBe(1)
    expect(result.created[0]?.type).toBe("SWAP_ANOMALY")
    expect(dbMock.insert).toHaveBeenCalledTimes(1)
  })
})

describe("severityRank", () => {
  it("should rank CRITICAL first, then WARNING, then INFO", () => {
    expect(severityRank("CRITICAL")).toBe(0)
    expect(severityRank("WARNING")).toBe(1)
    expect(severityRank("INFO")).toBe(2)
  })
})
