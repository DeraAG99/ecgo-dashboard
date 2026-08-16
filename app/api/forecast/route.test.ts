import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { execute: vi.fn() },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { GET } from "./route"

function setupRows(profile: unknown[], days: unknown[], actual: unknown[], cabinetsRows: unknown[]) {
  dbMock.execute
    .mockResolvedValueOnce({ rows: profile })
    .mockResolvedValueOnce({ rows: days })
    .mockResolvedValueOnce({ rows: actual })
    .mockResolvedValueOnce({ rows: cabinetsRows })
}

function fullProfile(hour = 12, cnt = 28) {
  const rows: Array<{ dow: number; hour: number; cnt: number }> = []
  for (let dow = 0; dow < 7; dow++) rows.push({ dow, hour, cnt })
  return rows
}

const actualRows = [
  { date: "2026-08-09", swaps: 10 },
  { date: "2026-08-10", swaps: 12 },
]

const cabinetRows = [{ id: "CB-001", code: "CB-001", branch: "Kemayoran", daily_avg: 8.5 }]

describe("GET /api/forecast", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return forecast summary with predicted totals", async () => {
    setupRows(fullProfile(), [{ days: 28 }], actualRows, cabinetRows)

    const res = await GET(new NextRequest("http://localhost/api/forecast?days=7"))
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.days).toBe(7)
    expect(body.totalActual).toBe(22)
    expect(body.forecastDaily).toHaveLength(7)
    expect(body.historicalDaily).toHaveLength(2)
    expect(body.hourlyPattern).toHaveLength(24)
    expect(body.peakHour.hour).toBe(12)
    expect(body.byCabinet).toHaveLength(1)
    expect(body.byCabinet[0].dailyAvg).toBe(8.5)
    expect(body.byCabinet[0].predictedTotal).toBe(60)
    const predictedSum = body.forecastDaily.reduce((a: number, b: { predicted: number }) => a + b.predicted, 0)
    expect(body.totalPredicted).toBe(predictedSum)
  })

  it("should accept branch filter", async () => {
    setupRows([], [{ days: 28 }], [], [])

    const res = await GET(new NextRequest("http://localhost/api/forecast?branch=Kemayoran"))
    expect(res.status).toBe(200)
    expect(dbMock.execute).toHaveBeenCalledTimes(4)
    expect(res.json()).toBeDefined()
  })

  it("should return 400 for invalid days", async () => {
    const res = await GET(new NextRequest("http://localhost/api/forecast?days=0"))
    expect(res.status).toBe(400)
    expect(dbMock.execute).not.toHaveBeenCalled()
  })

  it("should return 500 on db error", async () => {
    dbMock.execute.mockRejectedValue(new Error("db down"))
    const res = await GET(new NextRequest("http://localhost/api/forecast"))
    expect(res.status).toBe(500)
  })
})
