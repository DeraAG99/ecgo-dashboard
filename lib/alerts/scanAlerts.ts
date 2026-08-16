import { db } from "@/lib/db"
import { cabinets, slots, transactions, batteries, alerts } from "@/lib/schema"
import { sql, eq, isNull } from "drizzle-orm"
import type { Alert } from "@/lib/schema"

type NewAlertRow = {
  id: string
  type: "CABINET_OFFLINE" | "SLOT_FAULT" | "BATTERY_LOW" | "SWAP_ANOMALY"
  severity: "INFO" | "WARNING" | "CRITICAL"
  title: string
  message: string
  entityId: string | null
}

export async function scanAlerts(): Promise<{ created: Alert[]; count: number }> {
  const detected: NewAlertRow[] = []

  const offlineCabinets = await db
    .select({ id: cabinets.id, code: cabinets.code, branch: cabinets.branch, status: cabinets.status })
    .from(cabinets)
    .where(sql`${cabinets.status} IN ('OFFLINE', 'MAINTENANCE')`)

  offlineCabinets.forEach((c) => {
    const isOffline = c.status === "OFFLINE"
    detected.push({
      id: `al-${crypto.randomUUID()}`,
      type: "CABINET_OFFLINE",
      severity: isOffline ? "CRITICAL" : "WARNING",
      title: isOffline ? `Cabinet ${c.code} offline` : `Cabinet ${c.code} dalam perawatan`,
      message: `${c.code} (${c.branch}) ${isOffline ? "kehilangan koneksi" : "sedang dalam jadwal perawatan"}.`,
      entityId: c.id,
    })
  })

  const faultSlots = await db
    .select({ id: slots.id, cabinetId: slots.cabinetId, slotNumber: slots.slotNumber, code: cabinets.code })
    .from(slots)
    .leftJoin(cabinets, eq(slots.cabinetId, cabinets.id))
    .where(eq(slots.state, "FAULT"))
    .limit(100)

  faultSlots.forEach((s) => {
    detected.push({
      id: `al-${crypto.randomUUID()}`,
      type: "SLOT_FAULT",
      severity: "WARNING",
      title: `Slot fault di ${s.code ?? s.cabinetId}`,
      message: `Slot #${s.slotNumber} di cabinet ${s.code ?? s.cabinetId} dalam kondisi FAULT dan tidak bisa dipakai.`,
      entityId: s.id,
    })
  })

  const lowBatteries = await db
    .select({ id: batteries.id, batteryCode: batteries.batteryCode, health: batteries.health })
    .from(batteries)
    .where(sql`${batteries.health} < 20`)
    .limit(100)

  lowBatteries.forEach((b) => {
    detected.push({
      id: `al-${crypto.randomUUID()}`,
      type: "BATTERY_LOW",
      severity: "CRITICAL",
      title: `Baterai ${b.batteryCode} perlu diganti`,
      message: `Kesehatan baterai ${b.batteryCode} tersisa ${b.health}%, di bawah ambang 20%.`,
      entityId: b.id,
    })
  })

  const anomalyRows = await db.execute<{ id: string; code: string; branch: string; swaps24h: number; dailyAvg: number }>(sql`
    WITH stats AS (
      SELECT
        c.id,
        c.code,
        c.branch,
        COUNT(*) FILTER (WHERE t.swapped_at > NOW() - INTERVAL '24 hours') AS swaps24h,
        COUNT(*) FILTER (WHERE t.swapped_at > NOW() - INTERVAL '7 days') / 7.0 AS daily_avg
      FROM ${cabinets} c
      LEFT JOIN ${transactions} t ON t.cabinet_id = c.id
      GROUP BY c.id
    )
    SELECT id, code, branch, swaps24h::int as "swaps24h", ROUND(daily_avg, 1) as "dailyAvg"
    FROM stats
    WHERE daily_avg >= 5 AND swaps24h > 2.5 * daily_avg
  `)

  anomalyRows.rows.forEach((r) => {
    detected.push({
      id: `al-${crypto.randomUUID()}`,
      type: "SWAP_ANOMALY",
      severity: "INFO",
      title: `Lonjakan swap di ${r.code}`,
      message: `${r.code} (${r.branch}) mencatat ${r.swaps24h} swap dalam 24 jam, jauh di atas rata-rata harian ${r.dailyAvg}.`,
      entityId: r.id,
    })
  })

  const existing = await db
    .select({ type: alerts.type, entityId: alerts.entityId })
    .from(alerts)
    .where(isNull(alerts.resolvedAt))

  const existingKeys = new Set(existing.map((e) => `${e.type}:${e.entityId ?? ""}`))
  const toInsert = detected.filter((d) => !existingKeys.has(`${d.type}:${d.entityId ?? ""}`))

  if (toInsert.length === 0) {
    return { created: [], count: 0 }
  }

  await db.insert(alerts).values(toInsert)

  const created = await db
    .select()
    .from(alerts)
    .where(
      sql`${alerts.id} IN (${sql.join(toInsert.map((d) => sql`${d.id}`), sql`, `)})`
    )

  return { created, count: toInsert.length }
}

export function severityRank(severity: string): number {
  if (severity === "CRITICAL") return 0
  if (severity === "WARNING") return 1
  return 2
}
