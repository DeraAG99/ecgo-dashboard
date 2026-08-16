import { describe, it, expect, vi, beforeEach } from "vitest"
import { buildSelectChain } from "@/lib/test-utils"

const insertChain = (returned: unknown[] = []) => ({
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue(returned),
})

const dbMock = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  execute: vi.fn(),
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/maintenance/log", () => ({ addMaintenanceLog: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/maintenance/entities", () => ({ resolveEntityForLog: vi.fn().mockResolvedValue({ entityType: "CABINET", entityId: "CB-001", entityLabel: "CB-001" }) }))

const { createWorkOrderFromAlert } = vi.hoisted(() => ({
  createWorkOrderFromAlert: vi.fn(),
}))
vi.mock("@/lib/maintenance/createFromAlert", () => ({ createWorkOrderFromAlert }))

import { GET, POST } from "./route"

describe("GET /api/maintenance/work-orders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return 400 for invalid query", async () => {
    const res = await GET(new Request("http://localhost/api/maintenance/work-orders?status=INVALID") as never)
    expect(res.status).toBe(400)
    expect(dbMock.select).not.toHaveBeenCalled()
  })

  it("should return paginated work orders", async () => {
    const row = {
      id: "wo-1", entityType: "CABINET", entityId: "CB-001", title: "Test WO",
      priority: "HIGH", status: "OPEN", assignedTo: null, createdAt: new Date(),
    }
    dbMock.select
      .mockReturnValueOnce(buildSelectChain([row]))
      .mockReturnValueOnce(buildSelectChain([{ code: "CB-001" }]))
      .mockReturnValueOnce(buildSelectChain([{ total: 1 }]))

    const res = await GET(new Request("http://localhost/api/maintenance/work-orders?page=1&limit=20") as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].entityLabel).toBe("CB-001")
    expect(body.total).toBe(1)
    expect(body.totalPages).toBe(1)
  })
})

describe("POST /api/maintenance/work-orders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create from alert when source=alert", async () => {
    createWorkOrderFromAlert.mockResolvedValue({ id: "wo-1" })
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ source: "alert", alertId: "al-1" }) }) as never)
    expect(res.status).toBe(201)
    expect(createWorkOrderFromAlert).toHaveBeenCalledWith("al-1")
  })

  it("should create manual work order (201)", async () => {
    dbMock.insert.mockReturnValueOnce(insertChain([{ id: "wo-2" }]))
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ entityType: "CABINET", entityId: "CB-001", title: "Fix door", priority: "LOW" }),
      }) as never
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe("wo-2")
    expect(dbMock.insert).toHaveBeenCalled()
  })

  it("should return 400 for invalid body", async () => {
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({}) }) as never)
    expect(res.status).toBe(400)
  })
})
