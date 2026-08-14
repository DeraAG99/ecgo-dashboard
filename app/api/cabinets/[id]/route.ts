import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cabinets, slots, transactions } from "@/lib/schema"
import { z } from "zod"
import { eq, desc, and } from "drizzle-orm"

const paramsSchema = z.object({
  id: z.string().uuid(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = paramsSchema.parse({ id: params.id })

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

    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const transactions24h = await db.query.transactions.findMany({
      where: and(eq(transactions.cabinetId, id), transactions.swappedAt > twentyFourHoursAgo),
    })

    const chartDataMap = new Map<string, number>()
    for (let i = 0; i < 24; i++) {
      const hour = String(i).padStart(2, "0")
      chartDataMap.set(hour, 0)
    }

    transactions24h.forEach((tx) => {
      if (tx.swappedAt) {
        const hour = new Date(tx.swappedAt).getHours().toString().padStart(2, "0")
        chartDataMap.set(hour, (chartDataMap.get(hour) || 0) + 1)
      }
    })

    const chartData = Array.from(chartDataMap.entries()).map(([hour, count]) => ({
      hour: `${hour}:00`,
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
      chartData,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}