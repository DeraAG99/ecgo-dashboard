import { describe, it, expect } from "vitest"
import { sql, type SQL } from "drizzle-orm"
import { PgDialect } from "drizzle-orm/pg-core/dialect"
import { CasingCache } from "drizzle-orm/casing"
import { wibDateKey, wibHour, wibDow, wibDayTrunc, wibNowDayStart } from "./wib.sql"

const dialect = new PgDialect()
const casing = new CasingCache(undefined)

function render(expr: SQL) {
  return expr.toQuery({
    casing,
    escapeName: (name) => dialect.escapeName(name),
    escapeParam: (num) => dialect.escapeParam(num),
    escapeString: (str) => dialect.escapeString(str),
  })
}

function countAtTimeZone(sqlText: string): number {
  return sqlText.split("AT TIME ZONE").length - 1
}

describe("lib/time/wib.sql (WIB conversion)", () => {
  it("should apply exactly one WIB conversion per bucketing helper", () => {
    const cases: Array<[string, SQL, string]> = [
      ["wibDateKey", wibDateKey(sql`t.swapped_at`), "TO_CHAR(t.swapped_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD')"],
      ["wibHour", wibHour(sql`t.swapped_at`), "EXTRACT(HOUR FROM t.swapped_at AT TIME ZONE 'Asia/Jakarta')"],
      ["wibDow", wibDow(sql`t.swapped_at`), "EXTRACT(DOW FROM t.swapped_at AT TIME ZONE 'Asia/Jakarta')"],
      ["wibDayTrunc", wibDayTrunc(sql`t.swapped_at`), "date_trunc('day', t.swapped_at AT TIME ZONE 'Asia/Jakarta')"],
    ]

    for (const [name, expr, expectedSql] of cases) {
      const { sql: rendered, params } = render(expr)
      expect(countAtTimeZone(rendered), `${name} must convert once`).toBe(1)
      expect(rendered, name).toBe(expectedSql)
      expect(params, name).toEqual([])
    }
  })

  it("wibNowDayStart should yield a timestamptz WIB-midnight via two conversions", () => {
    const { sql: rendered, params } = render(wibNowDayStart())
    expect(countAtTimeZone(rendered)).toBe(2)
    expect(rendered).toBe("(date_trunc('day', NOW() AT TIME ZONE 'Asia/Jakarta')) AT TIME ZONE 'Asia/Jakarta'")
    expect(params).toEqual([])
  })
})
