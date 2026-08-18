import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { workOrders, alerts } from "@/lib/schema"
import { workOrderUpdateSchema } from "@/lib/validation"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { addMaintenanceLog } from "@/lib/maintenance/log"
import { resolveEntityForLog } from "@/lib/maintenance/entities"

type PatchBody = z.infer<typeof workOrderUpdateSchema>

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = workOrderUpdateSchema.parse(body) as PatchBody

    const existing = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1)
    if (existing.length === 0) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }
    const current = existing[0]!

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (parsed.status !== undefined) updates["status"] = parsed.status
    if (parsed.assignedTo !== undefined) updates["assigned_to"] = parsed.assignedTo
    if (parsed.priority !== undefined) updates["priority"] = parsed.priority
    if (parsed.title !== undefined) updates["title"] = parsed.title
    if (parsed.notes !== undefined) updates["notes"] = parsed.notes

    const prevStatus = current.status
    const newStatus = parsed.status ?? prevStatus

    if (newStatus === "DONE" && prevStatus !== "DONE") {
      updates["completed_at"] = new Date()
      if (current.alertId) {
        await db
          .update(alerts)
          .set({ read: true, resolvedAt: new Date() })
          .where(eq(alerts.id, current.alertId))
      }
    }

    if (!parsed.assignedTo && newStatus === "ASSIGNED" && !current.assignedTo) {
      return NextResponse.json({ error: "assignedTo required when transitioning to ASSIGNED" }, { status: 400 })
    }

    const updated = await db.update(workOrders).set(updates).where(eq(workOrders.id, id)).returning()

    const { entityType, entityId } = await resolveEntityForLog(current)
    await addMaintenanceLog({
      action: `WO_STATUS_${newStatus.toUpperCase()}`,
      entityType: entityType ?? "WORK_ORDER",
      entityId: entityId ?? current.id,
      entityLabel: current.title ?? current.id,
      detail: `prev=${prevStatus}`,
    })
    if (parsed.assignedTo !== undefined) {
      await addMaintenanceLog({
        action: "WO_ASSIGNED",
        entityType: "WORK_ORDER",
        entityId: current.id,
        entityLabel: current.title ?? current.id,
        detail: `assignedTo=${parsed.assignedTo ?? ""}`,
      })
    }

    return NextResponse.json(updated[0]!)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1)
  if (row.length === 0) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 })
  }
  return NextResponse.json(row[0])
}
