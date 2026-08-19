import { describe, it, expect, vi, afterEach } from "vitest"
import {
  WIB_ZONE,
  wibStartOfDay,
  wibEndOfDayExclusive,
  wibDateKey,
  wibTodayStart,
  formatWIB,
} from "./wib"

describe("lib/time/wib (Asia/Jakarta)", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("should expose the canonical WIB zone", () => {
    expect(WIB_ZONE).toBe("Asia/Jakarta")
  })

  it("wibStartOfDay should return WIB midnight for any Date", () => {
    const d = new Date("2026-08-15T10:00:00Z") // 17:00 WIB Aug 15
    expect(wibStartOfDay(d).toISOString()).toBe("2026-08-14T17:00:00.000Z")
  })

  it("wibStartOfDay should handle date crossing midnight WIB", () => {
    const d = new Date("2026-08-15T20:00:00Z") // 2026-08-16 03:00 WIB
    expect(wibStartOfDay(d).toISOString()).toBe("2026-08-15T17:00:00.000Z")
    expect(wibDateKey(wibStartOfDay(d))).toBe("2026-08-16")
  })

  it("wibEndOfDayExclusive should return next WIB midnight", () => {
    const d = new Date("2026-08-15T10:00:00Z") // 17:00 WIB Aug 15
    expect(wibEndOfDayExclusive(d).toISOString()).toBe("2026-08-15T17:00:00.000Z")
  })

  it("wibDateKey should produce a WIB date key regardless of host timezone", () => {
    const instant = new Date("2026-08-14T19:00:00Z")
    expect(wibDateKey(instant)).toBe("2026-08-15")
  })

  it("wibDateKey should map an instant just after WIB midnight to the next WIB day", () => {
    const inst = new Date("2026-08-15T17:30:00Z") // 2026-08-16 00:30 WIB
    expect(wibDateKey(inst)).toBe("2026-08-16")
  })

  it("wibTodayStart should return today's WIB midnight for a known instant", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T20:30:00Z")) // 2026-08-16 03:30 WIB
    const d = wibTodayStart()
    expect(d.toISOString()).toBe("2026-08-15T17:00:00.000Z")
    expect(wibDateKey(d)).toBe("2026-08-16")
  })

  it("wibTodayStart should be a valid date", () => {
    const d = wibTodayStart()
    expect(Number.isNaN(d.getTime())).toBe(false)
    expect(wibDateKey(d)).toBe(wibDateKey(new Date()))
  })

  it("formatWIB should render WIB and handle null/invalid", () => {
    const instant = new Date("2026-08-15T03:00:00Z")
    const out = formatWIB(instant)
    expect(out).toContain("10.00")
    expect(formatWIB(null)).toBe("-")
    expect(formatWIB("not-a-date")).toBe("-")
  })
})
