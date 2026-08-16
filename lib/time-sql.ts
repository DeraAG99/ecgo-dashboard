import { sql, type SQL, type SQLWrapper } from "drizzle-orm"
import { WIB_ZONE } from "./time"

function atZone(expr: SQLWrapper): SQL {
  return sql`${expr} AT TIME ZONE '${sql.raw(WIB_ZONE)}'`
}

export function wibDateKey(expr: SQLWrapper): SQL<string> {
  return sql`TO_CHAR(${atZone(expr)}, 'YYYY-MM-DD')` as SQL<string>
}

export function wibHour(expr: SQLWrapper): SQL<number> {
  return sql`EXTRACT(HOUR FROM ${atZone(expr)})` as SQL<number>
}

export function wibDow(expr: SQLWrapper): SQL<number> {
  return sql`EXTRACT(DOW FROM ${atZone(expr)})` as SQL<number>
}

export function wibDayTrunc(expr: SQLWrapper): SQL<Date> {
  return sql`date_trunc('day', ${atZone(expr)})` as SQL<Date>
}

export function wibNowDayStart(): SQL<Date> {
  return sql`(date_trunc('day', NOW() AT TIME ZONE 'Asia/Jakarta')) AT TIME ZONE 'Asia/Jakarta'` as SQL<Date>
}
