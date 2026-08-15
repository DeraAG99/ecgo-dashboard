import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    execute: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    query: {},
  },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { POST } from "./route"

function jsonPost(body: unknown) {
  return new NextRequest("http://localhost/api/swaps", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

function mockExecuteRows(rowsArray: unknown[][]) {
  rowsArray.forEach((rows) => {
    dbMock.execute.mockResolvedValueOnce({ rows })
  })
}

function mockInsertTx() {
  dbMock.insert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        {
          id: "tx-1715000000000-123",
          cabinetId: "CB-001",
          userId: "U-0001",
          oldBatteryId: "BATT-8F2K9LXA",
          newBatteryId: "BATT-4Q7T1MZC",
          swappedAt: new Date(),
        },
      ]),
    }),
  })
}

describe("POST /api/swaps", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should complete a swap when check-in is valid and slots exist", async () => {
    mockExecuteRows([
      [{ id: "ci-1", branchId: "CB-001" }],
      [{ id: "CB-001", code: "CB-001", branch: "Jakarta" }],
      [{ branch: "Jakarta" }],
      [{ full_count: "3", empty_count: "2" }],
    ])
    mockInsertTx()
    mockExecuteRows([
      [{ id: "slot-1", slotNumber: 1 }],
      [{ id: "slot-2", slotNumber: 2 }],
      [],
      [],
    ])

    const res = await POST(jsonPost({ userId: "U-0001", cabinetId: "CB-001" }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.transaction.id).toMatch(/^tx-/)
    expect(body.transaction.oldBatteryId).toMatch(/^BATT-[A-Z0-9]{8}$/)
    expect(body.transaction.newBatteryId).toMatch(/^BATT-[A-Z0-9]{8}$/)
    expect(body.slotChanges).toHaveLength(2)
    expect(body.slotChanges[0]).toEqual({ slotNumber: 1, from: "FULL", to: "EMPTY" })
    expect(body.slotChanges[1]).toEqual({ slotNumber: 2, from: "EMPTY", to: "CHARGING" })
  })

  it("should return 403 when there is no valid check-in within 15 minutes", async () => {
    dbMock.execute.mockResolvedValue({ rows: [] })

    const res = await POST(jsonPost({ userId: "U-0001", cabinetId: "CB-001" }))
    expect(res.status).toBe(403)
  })

  it("should return 404 when cabinet does not exist", async () => {
    mockExecuteRows([
      [{ id: "ci-1", branchId: "CB-001" }],
      [],
    ])

    const res = await POST(jsonPost({ userId: "U-0001", cabinetId: "CB-999" }))
    expect(res.status).toBe(404)
  })

  it("should return 403 when cabinet branch does not match check-in branch", async () => {
    mockExecuteRows([
      [{ id: "ci-1", branchId: "CB-001" }],
      [{ id: "CB-002", code: "CB-002", branch: "Bekasi" }],
      [{ branch: "Jakarta" }],
    ])

    const res = await POST(jsonPost({ userId: "U-0001", cabinetId: "CB-002" }))
    expect(res.status).toBe(403)
    expect((await res.json()).error).toContain("Cabang")
  })

  it("should return 409 when no FULL/EMPTY slot is available", async () => {
    mockExecuteRows([
      [{ id: "ci-1", branchId: "CB-001" }],
      [{ id: "CB-001", code: "CB-001", branch: "Jakarta" }],
      [{ branch: "Jakarta" }],
      [{ full_count: "0", empty_count: "2" }],
    ])

    const res = await POST(jsonPost({ userId: "U-0001", cabinetId: "CB-001" }))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toContain("Slot")
  })

  it("should return 400 for invalid body", async () => {
    const res = await POST(jsonPost({ userId: "U-0001" }))
    expect(res.status).toBe(400)
    expect(dbMock.execute).not.toHaveBeenCalled()
  })
})
