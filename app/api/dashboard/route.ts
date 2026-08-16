import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cabinets, slots, transactions } from "@/lib/schema"
import { sql, gte, desc, count } from "drizzle-orm"
import { jakartaTodayStart, jakartaDateKey } from "@/lib/time"
import { wibDateKey } from "@/lib/time-sql"

export async function GET() {
  try {
    const todayStart = jakartaTodayStart()
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000)

    const [cabinetRows, slotRows, swapTodayRow, swap7dRows] = await Promise.all([
      db
        .select({
          status: cabinets.status,
          count: count(),
        })
        .from(cabinets)
        .groupBy(cabinets.status),
      db
        .select({
          state: slots.state,
          count: count(),
        })
        .from(slots)
        .groupBy(slots.state),
      db
        .select({ total: count() })
        .from(transactions)
        .where(gte(transactions.swappedAt, todayStart)),
      db
        .select({
          day: wibDateKey(transactions.swappedAt),
          total: count(),
        })
        .from(transactions)
        .where(gte(transactions.swappedAt, sevenDaysAgo))
        .groupBy(wibDateKey(transactions.swappedAt)),
    ])

    const statusMap: Record<string, number> = {
      ONLINE: 0,
      OFFLINE: 0,
      MAINTENANCE: 0,
    }
    cabinetRows.forEach((r) => {
      statusMap[r.status ?? "ONLINE"] = Number(r.count)
    })

    const slotMap: Record<string, number> = {
      EMPTY: 0,
      CHARGING: 0,
      FULL: 0,
      LOCKED: 0,
      FAULT: 0,
    }
    slotRows.forEach((r) => {
      slotMap[r.state ?? "EMPTY"] = Number(r.count)
    })

    const dayMap = new Map<string, number>()
    const labels: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
      labels.push(jakartaDateKey(d))
    }
    swap7dRows.forEach((r) => {
      dayMap.set(r.day, Number(r.total))
    })
    const weeklyTrend = labels.map((day) => ({
      day: new Date(day + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short" }),
      total: dayMap.get(day) ?? 0,
    }))

    const alerts = await db
      .select()
      .from(cabinets)
      .where(sql`${cabinets.status} IN ('OFFLINE', 'MAINTENANCE')`)
      .orderBy(desc(cabinets.lastHeartbeat))
      .limit(5)

    return NextResponse.json({
      totalCabinets: cabinetRows.reduce((acc, r) => acc + Number(r.count), 0),
      onlineCabinets: statusMap["ONLINE"],
      offlineCabinets: statusMap["OFFLINE"],
      maintenanceCabinets: statusMap["MAINTENANCE"],
      totalSwapToday: Number(swapTodayRow[0]?.total ?? 0),
      totalSwap7d: swap7dRows.reduce((acc, r) => acc + Number(r.total), 0),
      batteriesAvailable: slotMap["FULL"],
      batteriesCharging: slotMap["CHARGING"],
      batteriesEmpty: slotMap["EMPTY"],
      batteriesLocked: slotMap["LOCKED"],
      batteriesFault: slotMap["FAULT"],
      weeklyTrend,
      alerts: alerts.map((c) => ({
        id: c.id,
        code: c.code,
        branch: c.branch,
        status: c.status,
        lastHeartbeat: c.lastHeartbeat,
      })),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
