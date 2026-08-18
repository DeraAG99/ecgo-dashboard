import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cabinets } from "@/lib/schema"
import { maintenanceActionSchema } from "@/lib/validation"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { addMaintenanceLog } from "@/lib/maintenance/log"

const STATUS_BY_ACTION: Record<string, string> = {
  SET_ONLINE: "ONLINE",
  SET_OFFLINE: "OFFLINE",
  SET_MAINTENANCE: "MAINTENANCE",
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, reason } = maintenanceActionSchema.parse(body)

    const targetStatus = STATUS_BY_ACTION[action]
    if (!targetStatus) {
      return NextResponse.json({ error: `Invalid action for cabinet: ${action}` }, { status: 400 })
    }

    const cabinet = await db.select().from(cabinets).where(eq(cabinets.id, id)).limit(1)
    if (cabinet.length === 0) {
      return NextResponse.json({ error: "Cabinet not found" }, { status: 404 })
    }
    const c = cabinet[0]!
    const prevStatus = c.status
    await db
      .update(cabinets)
      .set({ status: targetStatus as "ONLINE" | "OFFLINE" | "MAINTENANCE" })
      .where(eq(cabinets.id, id))

    await addMaintenanceLog({
      action: `CABINET_${targetStatus}`,
      entityType: "CABINET",
      entityId: id,
      entityLabel: c.code,
      detail: `prevStatus=${prevStatus}; reason=${reason ?? ""}`,
    })

    return NextResponse.json({ id, code: c.code, status: targetStatus })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
