import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { dbMock } = vi.hoisted(() => ({
  dbMock: { update: vi.fn() },
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))

import { PATCH } from "./route"

function updateChain(data: unknown[]) {
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(data),
  }
}

describe("PATCH /api/alerts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should mark a single alert as read", async () => {
    dbMock.update.mockReturnValue(
      updateChain([
        {
          id: "al-1",
          type: "SLOT_FAULT",
          severity: "WARNING",
          title: "Slot fault",
          message: "Slot #3 fault",
          read: true,
        },
      ])
    )

    const res = await PATCH(new NextRequest("http://localhost/api/alerts/al-1"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe("al-1")
    expect(body.read).toBe(true)
  })

  it("should return 404 when alert not found", async () => {
    dbMock.update.mockReturnValue(updateChain([]))

    const res = await PATCH(new NextRequest("http://localhost/api/alerts/al-999"))
    expect(res.status).toBe(404)
  })

  it("should return 500 on db error", async () => {
    dbMock.update.mockImplementation(() => {
      throw new Error("db down")
    })

    const res = await PATCH(new NextRequest("http://localhost/api/alerts/al-1"))
    expect(res.status).toBe(500)
  })
})
