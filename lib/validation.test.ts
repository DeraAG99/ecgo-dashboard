import { describe, it, expect } from "vitest"
import { cabinetsQuerySchema, cabinetParamsSchema, transactionsQuerySchema } from "./validation"

describe("cabinetsQuerySchema", () => {
  it("should parse default parameters", () => {
    const result = cabinetsQuerySchema.parse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(10)
    expect(result.sortBy).toBe("swapCount24h")
    expect(result.sortOrder).toBe("desc")
  })

  it("should parse valid status values", () => {
    expect(cabinetsQuerySchema.parse({ status: "ONLINE" }).status).toBe("ONLINE")
    expect(cabinetsQuerySchema.parse({ status: "OFFLINE" }).status).toBe("OFFLINE")
    expect(cabinetsQuerySchema.parse({ status: "MAINTENANCE" }).status).toBe("MAINTENANCE")
  })

  it("should reject invalid status", () => {
    expect(() => cabinetsQuerySchema.parse({ status: "INVALID" })).toThrow()
  })

  it("should coerce page from string", () => {
    const result = cabinetsQuerySchema.parse({ page: "3" })
    expect(result.page).toBe(3)
    expect(typeof result.page).toBe("number")
  })

  it("should reject non-positive page", () => {
    expect(() => cabinetsQuerySchema.parse({ page: 0 })).toThrow()
    expect(() => cabinetsQuerySchema.parse({ page: -1 })).toThrow()
  })

  it("should reject unknown sortBy", () => {
    expect(() => cabinetsQuerySchema.parse({ sortBy: "branch" })).toThrow()
  })

  it("should allow search and status together", () => {
    const result = cabinetsQuerySchema.parse({ search: "CB-001", status: "ONLINE" })
    expect(result.search).toBe("CB-001")
    expect(result.status).toBe("ONLINE")
  })
})

describe("cabinetParamsSchema", () => {
  it("should parse valid cabinet id", () => {
    const result = cabinetParamsSchema.parse({ id: "CB-001" })
    expect(result.id).toBe("CB-001")
  })

  it("should reject empty id", () => {
    expect(() => cabinetParamsSchema.parse({ id: "" })).toThrow()
  })

  it("should reject missing id", () => {
    expect(() => cabinetParamsSchema.parse({})).toThrow()
  })
})

describe("transactionsQuerySchema", () => {
  it("should apply defaults", () => {
    const result = transactionsQuerySchema.parse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it("should accept cabinetId", () => {
    const result = transactionsQuerySchema.parse({ cabinetId: "CB-001" })
    expect(result.cabinetId).toBe("CB-001")
  })

  it("should reject negative limit", () => {
    expect(() => transactionsQuerySchema.parse({ limit: -5 })).toThrow()
  })
})
