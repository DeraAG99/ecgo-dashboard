import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cabinets, slots, batteries, workOrders, alerts } from "@/lib/schema"
import { sql, eq, isNull } from "drizzle-orm"

export async function GET() {
  try {
    const byStatus = await db
      .select({ status: cabinets.status, count: sql<number>`count(*)::int` })
      .from(cabinets)
      .groupBy(cabinets.status)

    const cabinetStatus = { ONLINE: 0, OFFLINE: 0, MAINTENANCE: 0 }
    byStatus.forEach((r) => {
      cabinetStatus[r.status as keyof typeof cabinetStatus] = Number(r.count)
    })

    const bySlot = await db
      .select({ state: slots.state, count: sql<number>`count(*)::int` })
      .from(slots)
      .groupBy(slots.state)
    const slotState = { EMPTY: 0, CHARGING: 0, FULL: 0, LOCKED: 0, FAULT: 0 }
    bySlot.forEach((r) => {
      slotState[r.state as keyof typeof slotState] = Number(r.count)
    })

    const byBattery = await db
      .select({ status: batteries.status, count: sql<number>`count(*)::int` })
      .from(batteries)
      .groupBy(batteries.status)
    const batteryStatus = { AVAILABLE: 0, IN_USE: 0, CHARGING: 0, FAULT: 0, RETIRED: 0 }
    byBattery.forEach((r) => {
      batteryStatus[r.status as keyof typeof batteryStatus] = Number(r.count)
    })

    const lowHealthCount = Number(
      (
        await db
          .select({ count: sql<number>`count(*)::int` })
          .from(batteries)
          .where(sql`${batteries.health} < 20`)
      )[0]?.count ?? 0
    )
    const healthBuckets = { "0-19": 0, "20-39": 0, "40-59": 0, "60-79": 0, "80-100": 0 }
    const bucketed = await db.execute<{ bucket: string; count: number }>(sql`
      SELECT
        CASE
          WHEN health < 20 THEN '0-19'
          WHEN health < 40 THEN '20-39'
          WHEN health < 60 THEN '40-59'
          WHEN health < 80 THEN '60-79'
          ELSE '80-100'
        END AS bucket,
        count(*)::int AS count
      FROM ${batteries}
      GROUP BY 1
    `)
    bucketed.rows.forEach((r) => {
      const key = r.bucket as keyof typeof healthBuckets
      if (key in healthBuckets) healthBuckets[key] = Number(r.count)
    })

    const byWoStatus = await db
      .select({ status: workOrders.status, count: sql<number>`count(*)::int` })
      .from(workOrders)
      .groupBy(workOrders.status)
    const woStatus = { OPEN: 0, ASSIGNED: 0, IN_PROGRESS: 0, DONE: 0, CANCELLED: 0 }
    byWoStatus.forEach((r) => {
      woStatus[r.status as keyof typeof woStatus] = Number(r.count)
    })

    const unresolvedAlerts = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(alerts)
      .where(isNull(alerts.resolvedAt))

    const openWoCount = Number(
      (
        await db
          .select({ count: sql<number>`count(*)::int` })
          .from(workOrders)
          .where(eq(workOrders.status, "OPEN"))
      )[0]?.count ?? 0
    )

    return NextResponse.json({
      cabinets: cabinetStatus,
      slots: slotState,
      slotFaultCount: Number(
        (
          await db
            .select({ count: sql<number>`count(*)::int` })
            .from(slots)
            .where(eq(slots.state, "FAULT"))
        )[0]?.count ?? 0
      ),
      slotLockedCount: Number(
        (
          await db
            .select({ count: sql<number>`count(*)::int` })
            .from(slots)
            .where(eq(slots.state, "LOCKED"))
        )[0]?.count ?? 0
      ),
      batteries: batteryStatus,
      batteryLowHealthCount: lowHealthCount,
      batteryHealthBuckets: healthBuckets,
      alerts: {
        unresolved: Number(unresolvedAlerts[0]?.count ?? 0),
      },
      workOrders: {
        byStatus: woStatus,
        openCount: openWoCount
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
