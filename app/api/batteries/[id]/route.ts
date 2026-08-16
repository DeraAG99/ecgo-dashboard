import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { batteries, transactions, cabinets } from "@/lib/schema"
import { batteryParamsSchema } from "@/lib/validation"
import { z } from "zod"
import { eq, desc, sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const { id } = batteryParamsSchema.parse({ id: req.nextUrl.pathname.split("/").pop() || "" })

    const battery = await db.query.batteries.findFirst({
      where: eq(batteries.id, id),
      with: {
        cabinet: true,
      },
    })

    if (!battery) {
      return NextResponse.json({ error: "Battery not found" }, { status: 404 })
    }

    const history = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        oldBatteryId: transactions.oldBatteryId,
        newBatteryId: transactions.newBatteryId,
        cabinetId: transactions.cabinetId,
        cabinetCode: cabinets.code,
        branch: cabinets.branch,
        swappedAt: transactions.swappedAt,
      })
      .from(transactions)
      .leftJoin(cabinets, eq(transactions.cabinetId, cabinets.id))
      .where(
        sql`(${transactions.newBatteryId} = ${battery.batteryCode} OR ${transactions.oldBatteryId} = ${battery.batteryCode})`
      )
      .orderBy(desc(transactions.swappedAt))
      .limit(20)

    return NextResponse.json({ battery, history })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
