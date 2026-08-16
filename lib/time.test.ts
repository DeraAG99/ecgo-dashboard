import { describe, it, expect, vi, afterEach } from "vitest"
import {
  WIB_ZONE,
  jakartaDayStart,
  jakartaDayEndExclusive,
  jakartaDateKey,
  jakartaTodayStart,
  formatJakarta,
} from "./time"

describe("lib/time (Asia/Jakarta)", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("should expose the canonical WIB zone", () => {
    expect(WIB_ZONE).toBe("Asia/Jakarta")
  })

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

  it("jakartaDateKey should map an instant just after WIB midnight to the next WIB day", () => {
    const inst = new Date("2026-08-15T17:30:00Z") // 2026-08-16 00:30 WIB
    expect(jakartaDateKey(inst)).toBe("2026-08-16")
  })

  it("jakartaTodayStart should return today's WIB midnight for a known instant", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T20:30:00Z")) // 2026-08-16 03:30 WIB
    const d = jakartaTodayStart()
    expect(d.toISOString()).toBe("2026-08-15T17:00:00.000Z")
    expect(jakartaDateKey(d)).toBe("2026-08-16")
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
