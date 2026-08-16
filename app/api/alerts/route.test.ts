import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { buildSelectChain } from "@/lib/test-utils"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), update: vi.fn() },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

const { scanMock } = vi.hoisted(() => ({ scanMock: vi.fn() }))

vi.mock("@/lib/alerts/scanAlerts", () => ({
  scanAlerts: scanMock,
}))

import { GET, POST, PATCH } from "./route"

const alertRow = {
  id: "al-1",
  type: "CABINET_OFFLINE",
  severity: "CRITICAL",
  title: "Cabinet CB-001 offline",
  message: "CB-001 kehilangan koneksi.",
  entityId: "CB-001",
  read: false,
  createdAt: new Date("2026-08-15T02:00:00Z"),
}

function updateChain(data: unknown[]) {
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(data),
  }
}

describe("GET /api/alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return paginated alert list with unread count", async () => {
    dbMock.select
      .mockReturnValueOnce(buildSelectChain([alertRow]))
      .mockReturnValueOnce(buildSelectChain([{ total: 1 }]))
      .mockReturnValueOnce(buildSelectChain([{ total: 1 }]))

    const res = await GET(new NextRequest("http://localhost/api/alerts?limit=20"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].title).toBe("Cabinet CB-001 offline")
    expect(body.unread).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it("should apply read and severity filters", async () => {
    dbMock.select
      .mockReturnValueOnce(buildSelectChain([]))
      .mockReturnValueOnce(buildSelectChain([{ total: 0 }]))
      .mockReturnValueOnce(buildSelectChain([{ total: 0 }]))

    const res = await GET(
      new NextRequest("http://localhost/api/alerts?read=false&severity=CRITICAL")
    )
    expect(res.status).toBe(200)
    expect(dbMock.select).toHaveBeenCalledTimes(3)
  })

  it("should return 400 for invalid query", async () => {
    const res = await GET(new NextRequest("http://localhost/api/alerts?type=INVALID"))
    expect(res.status).toBe(400)
    expect(dbMock.select).not.toHaveBeenCalled()
  })

  it("should return 500 on db error", async () => {
    dbMock.select.mockImplementationOnce(() => {
      throw new Error("db down")
    })
    const res = await GET(new NextRequest("http://localhost/api/alerts"))
    expect(res.status).toBe(500)
  })
})

describe("POST /api/alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should run scan and return created alerts", async () => {
    scanMock.mockResolvedValue({ created: [alertRow], count: 1 })
    const res = await POST()
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.count).toBe(1)
    expect(scanMock).toHaveBeenCalledTimes(1)
  })

  it("should return 500 when scan fails", async () => {
    scanMock.mockRejectedValue(new Error("db down"))
    const res = await POST()
    expect(res.status).toBe(500)
  })
})

describe("PATCH /api/alerts (mark all read)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should mark all alerts as read", async () => {
    dbMock.update.mockReturnValue(updateChain([{ id: "al-1" }]))
    const res = await PATCH()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.updated).toBe(1)
  })

  it("should return 500 on db error", async () => {
    dbMock.update.mockImplementation(() => {
      throw new Error("db down")
    })
    const res = await PATCH()
    expect(res.status).toBe(500)
  })
})
