import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cabinets, slots, transactions } from "@/lib/schema"
import { cabinetParamsSchema } from "@/lib/validation"
import { z } from "zod"
import { sql, eq, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const { id } = cabinetParamsSchema.parse({ id: req.nextUrl.pathname.split("/").pop() || "" })

    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const cabinetData = await db.query.cabinets.findFirst({
      where: eq(cabinets.id, id),
    })

    if (!cabinetData) {
      return NextResponse.json({ error: "Cabinet not found" }, { status: 404 })
    }

    const slotsData = await db.query.slots.findMany({
      where: eq(slots.cabinetId, id),
      orderBy: (s) => [s.slotNumber],
    })

    const swapHistory = await db
      .select()
      .from(transactions)
      .where(eq(transactions.cabinetId, id))
      .orderBy(desc(transactions.swappedAt))
      .limit(20)

    const chartData = await db.execute<{ hour: string; count: number }>(sql`
      SELECT 
        LPAD(FLOOR(EXTRACT(HOUR FROM t.swapped_at))::TEXT, 2, '0') || ':00' as hour,
        COUNT(*)::int as count
      FROM ${transactions} t
      WHERE t.cabinet_id = ${id} AND t.swapped_at > NOW() - INTERVAL '24 hours'
      GROUP BY FLOOR(EXTRACT(HOUR FROM t.swapped_at))
      ORDER BY hour
    `)

    const chartMap = new Map<string, number>()
    for (let i = 0; i < 24; i++) {
      chartMap.set(String(i).padStart(2, "0") + ":00", 0)
    }
    for (const row of chartData.rows) {
      chartMap.set(row.hour, row.count)
    }

    const chartDataArray = Array.from(chartMap.entries()).map(([hour, count]) => ({
      hour,
      count,
    }))

    return NextResponse.json({
      id: cabinetData.id,
      code: cabinetData.code,
      branch: cabinetData.branch,
      status: cabinetData.status,
      lastHeartbeat: cabinetData.lastHeartbeat,
      slots: slotsData,
      swapHistory,
      chartData: chartDataArray,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}