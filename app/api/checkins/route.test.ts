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

import { GET, POST } from "./route"

const cabinetRow = {
  id: "CB-001",
  branch: "Jakarta",
  lat: -6.2,
  lng: 106.82,
  radius_m: 200,
  status: "ONLINE",
}

function mockInsertReturning(record: unknown) {
  dbMock.insert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([record]),
    }),
  })
}

describe("POST /api/checkins", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return VALID when location is inside cabinet radius", async () => {
    dbMock.execute.mockResolvedValue({ rows: [cabinetRow] })
    mockInsertReturning({
      id: "ci-abc123",
      userId: "U-0001",
      lat: -6.2001,
      lng: 106.82,
      accuracyM: 15,
      result: "VALID",
      reason: null,
      branchId: "CB-001",
      distanceM: 11,
      createdAt: new Date(),
    })

    const res = await POST(
      new NextRequest("http://localhost/api/checkins", {
        method: "POST",
        body: JSON.stringify({ userId: "U-0001", lat: -6.2001, lng: 106.82, accuracyM: 15 }),
      })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.result.status).toBe("VALID")
    expect(body.result.branchId).toBe("CB-001")
    expect(body.checkIn.branch?.id).toBe("CB-001")
    expect(dbMock.insert).toHaveBeenCalledTimes(1)
  })

  it("should return OUT_OF_RANGE when location is far from all cabinets", async () => {
    dbMock.execute.mockResolvedValue({ rows: [cabinetRow] })
    mockInsertReturning({
      id: "ci-xyz789",
      userId: "U-0002",
      lat: -6.5,
      lng: 106.5,
      accuracyM: 15,
      result: "OUT_OF_RANGE",
      reason: null,
      branchId: "CB-001",
      distanceM: 46144,
      createdAt: new Date(),
    })

    const res = await POST(
      new NextRequest("http://localhost/api/checkins", {
        method: "POST",
        body: JSON.stringify({ userId: "U-0002", lat: -6.5, lng: 106.5, accuracyM: 15 }),
      })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.result.status).toBe("OUT_OF_RANGE")
    expect(body.result.nearestBranchId).toBe("CB-001")
  })

  it("should return REJECTED LOW_ACCURACY when accuracy exceeds 100m", async () => {
    dbMock.execute.mockResolvedValue({ rows: [cabinetRow] })
    mockInsertReturning({
      id: "ci-low000",
      userId: "U-0003",
      lat: -6.2,
      lng: 106.82,
      accuracyM: 140,
      result: "REJECTED",
      reason: "LOW_ACCURACY",
      branchId: null,
      distanceM: null,
      createdAt: new Date(),
    })

    const res = await POST(
      new NextRequest("http://localhost/api/checkins", {
        method: "POST",
        body: JSON.stringify({ userId: "U-0003", lat: -6.2, lng: 106.82, accuracyM: 140 }),
      })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.result.status).toBe("REJECTED")
    expect(body.result.reason).toBe("LOW_ACCURACY")
  })

  it("should return 400 for invalid body", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/checkins", {
        method: "POST",
        body: JSON.stringify({ userId: "U-0001", lat: "not-a-number", lng: 106.82, accuracyM: 15 }),
      })
    )
    expect(res.status).toBe(400)
    expect(dbMock.execute).not.toHaveBeenCalled()
  })
})

describe("GET /api/checkins", () => {
  const row = {
    id: "ci-abc123",
    userId: "U-0001",
    lat: -6.2001,
    lng: 106.82,
    accuracyM: 15,
    result: "VALID",
    reason: null,
    branchId: "CB-001",
    distanceM: 11,
    createdAt: new Date("2026-08-15T00:00:00Z"),
    branchCode: "CB-001",
    branchName: "Jakarta",
    _total: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return paginated check-in history", async () => {
    dbMock.execute.mockResolvedValue({ rows: [row] })

    const res = await GET(new NextRequest("http://localhost/api/checkins"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe("ci-abc123")
    expect(body.data[0].result).toBe("VALID")
    expect(body.data[0].branch?.name).toBe("Jakarta")
    expect(body.total).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it("should return 400 for invalid result filter", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/checkins?result=INVALID")
    )
    expect(res.status).toBe(400)
    expect(dbMock.execute).not.toHaveBeenCalled()
  })

  it("should apply user and result filters", async () => {
    dbMock.execute.mockResolvedValue({ rows: [] })

    await GET(
      new NextRequest(
        "http://localhost/api/checkins?userId=U-0001&result=VALID&page=2&limit=10"
      )
    )
    expect(dbMock.execute).toHaveBeenCalledTimes(1)
  })
})
