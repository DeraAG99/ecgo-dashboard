import { describe, it, expect } from "vitest"
import {
  jakartaDayStart,
  jakartaDayEndExclusive,
  jakartaDateKey,
  jakartaTodayStart,
  formatJakarta,
} from "./time"

describe("lib/time (Asia/Jakarta)", () => {
  it("should convert a UTC-midnight date to WIB day start", () => {
    const utcMidnight = new Date("2026-08-15T00:00:00Z")
    expect(jakartaDayStart(utcMidnight).toISOString()).toBe("2026-08-14T17:00:00.000Z")
  })

  it("should convert a UTC-midnight date to WIB day end (exclusive)", () => {
    const utcMidnight = new Date("2026-08-15T00:00:00Z")
    expect(jakartaDayEndExclusive(utcMidnight).toISOString()).toBe("2026-08-15T17:00:00.000Z")
  })

  it("should produce a WIB date key regardless of host timezone", () => {
    const instant = new Date("2026-08-14T19:00:00Z")
    expect(jakartaDateKey(instant)).toBe("2026-08-15")
  })

  it("jakartaTodayStart should be a valid date", () => {
    const d = jakartaTodayStart()
    expect(Number.isNaN(d.getTime())).toBe(false)
    expect(jakartaDateKey(d)).toBe(jakartaDateKey(new Date()))
  })

  it("formatJakarta should render WIB and handle null/invalid", () => {
    const instant = new Date("2026-08-15T03:00:00Z")
    const out = formatJakarta(instant)
    expect(out).toContain("10.00")
    expect(formatJakarta(null)).toBe("-")
    expect(formatJakarta("not-a-date")).toBe("-")
  })
})
