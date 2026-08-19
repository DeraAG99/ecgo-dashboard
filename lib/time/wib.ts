export const WIB_ZONE = "Asia/Jakarta"

const WIB_OFFSET_MS = 7 * 3600 * 1000

export function wibStartOfDay(date: Date): Date {
  const key = date.toLocaleDateString("en-CA", { timeZone: WIB_ZONE })
  return new Date(new Date(key).getTime() - WIB_OFFSET_MS)
}

export function wibEndOfDayExclusive(date: Date): Date {
  return new Date(wibStartOfDay(date).getTime() + 24 * 3600 * 1000)
}

export function wibDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: WIB_ZONE })
}

export function wibTodayStart(): Date {
  const key = new Date().toLocaleDateString("en-CA", { timeZone: WIB_ZONE })
  return new Date(new Date(key).getTime() - WIB_OFFSET_MS)
}

export function formatWIB(value: Date | string | null | undefined): string {
  if (value == null) return "-"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("id-ID", { timeZone: WIB_ZONE })
}
