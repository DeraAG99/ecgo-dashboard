import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { slots, cabinets } from "@/lib/schema"
import { maintenanceActionSchema } from "@/lib/validation"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { addMaintenanceLog } from "@/lib/maintenance/log"

const STATE_BY_ACTION: Record<string, string> = {
  LOCK: "LOCKED",
  UNLOCK: "EMPTY",
  RESET: "EMPTY",
}

const DESC_BY_ACTION: Record<string, string> = {
  LOCK: "Slot dikunci paksa",
  UNLOCK: "Slot dibuka pakai (reset ke EMPTY)",
  RESET: "Slot fault direset ke EMPTY",
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, reason } = maintenanceActionSchema.parse(body)

    const targetState = STATE_BY_ACTION[action]
    if (!targetState) {
      return NextResponse.json({ error: `Invalid action for slot: ${action}` }, { status: 400 })
    }

    const slot = await db
      .select({ id: slots.id, cabinetId: slots.cabinetId, slotNumber: slots.slotNumber, state: slots.state })
      .from(slots)
      .where(eq(slots.id, id))
      .limit(1)
    if (slot.length === 0) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 })
    }
    const s = slot[0]!
    const cabinet = await db.select({ code: cabinets.code }).from(cabinets).where(eq(cabinets.id, s.cabinetId)).limit(1)
    const c = cabinet[0]
    const label = `${c?.code ?? s.cabinetId} Slot #${s.slotNumber}`
    const prevState = s.state

    await db
      .update(slots)
      .set({ state: targetState as "EMPTY" | "CHARGING" | "FULL" | "LOCKED" | "FAULT", lastUpdated: new Date() })
      .where(eq(slots.id, id))

    await addMaintenanceLog({
      action: `SLOT_${action}`,
      entityType: "SLOT",
      entityId: id,
      entityLabel: label,
      detail: `${DESC_BY_ACTION[action] ?? action}; prevState=${prevState}; reason=${reason ?? ""}`,
    })

    return NextResponse.json({ id, entityLabel: label, prevState, newState: targetState })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
