import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { batteries } from "@/lib/schema"
import { maintenanceActionSchema } from "@/lib/validation"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { addMaintenanceLog } from "@/lib/maintenance/log"

const STATUS_BY_ACTION: Record<string, string> = {
  RETIRE: "RETIRED",
  FAULT: "FAULT",
  REACTIVATE: "AVAILABLE",
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, reason } = maintenanceActionSchema.parse(body)

    const targetStatus = STATUS_BY_ACTION[action]
    if (!targetStatus) {
      return NextResponse.json({ error: `Invalid action for battery: ${action}` }, { status: 400 })
    }

    const battery = await db.select().from(batteries).where(eq(batteries.id, id)).limit(1)
    if (battery.length === 0) {
      return NextResponse.json({ error: "Battery not found" }, { status: 404 })
    }
    const b = battery[0]!
    const prevStatus = b.status
    await db
      .update(batteries)
      .set({ status: targetStatus as "AVAILABLE" | "IN_USE" | "CHARGING" | "FAULT" | "RETIRED" })
      .where(eq(batteries.id, id))

    const detail = `${action} (${prevStatus} -> ${targetStatus}); reason=${reason ?? ""}`
    await addMaintenanceLog({
      action: `BATTERY_${action}`,
      entityType: "BATTERY",
      entityId: id,
      entityLabel: b.batteryCode,
      detail,
    })

    return NextResponse.json({ id, batteryCode: b.batteryCode, prevStatus, newStatus: targetStatus })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
