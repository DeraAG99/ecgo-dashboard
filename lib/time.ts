export const WIB_ZONE = "Asia/Jakarta"

const WIB_OFFSET_MS = 7 * 3600 * 1000

export function jakartaDayStart(date: Date): Date {
  return new Date(date.getTime() - WIB_OFFSET_MS)
}

export function jakartaDayEndExclusive(date: Date): Date {
  return new Date(date.getTime() + 24 * 3600 * 1000 - WIB_OFFSET_MS)
}

export function jakartaDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: WIB_ZONE })
}

export function jakartaTodayStart(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WIB_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const map: Record<string, string> = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return new Date(Date.UTC(Number(map["year"]), Number(map["month"]) - 1, Number(map["day"])) - WIB_OFFSET_MS)
}

export function formatJakarta(value: Date | string | null | undefined): string {
  if (value == null) return "-"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("id-ID", { timeZone: WIB_ZONE })
}
