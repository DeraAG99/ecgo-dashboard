import { db } from "@/lib/db"
import { cabinets, slots, batteries, type WorkOrder } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function resolveEntityForLog(wo: WorkOrder | { entityType: string; entityId: string }) {
  const { entityType, entityId } = wo
  if (entityType === "CABINET") {
    const c = await db.select({ code: cabinets.code }).from(cabinets).where(eq(cabinets.id, entityId)).limit(1)
    return { entityType: "CABINET" as const, entityId, entityLabel: c[0]?.code }
  }
  if (entityType === "SLOT") {
    const s = await db
      .select({ cabinetId: slots.cabinetId, slotNumber: slots.slotNumber })
      .from(slots)
      .where(eq(slots.id, entityId))
      .limit(1)
    if (s[0]) {
      const c = await db.select({ code: cabinets.code }).from(cabinets).where(eq(cabinets.id, s[0].cabinetId)).limit(1)
      return { entityType: "SLOT" as const, entityId, entityLabel: `${c[0]?.code ?? s[0].cabinetId} Slot #${s[0].slotNumber}` }
    }
  }
  if (entityType === "BATTERY") {
    const b = await db.select({ batteryCode: batteries.batteryCode }).from(batteries).where(eq(batteries.id, entityId)).limit(1)
    return { entityType: "BATTERY" as const, entityId, entityLabel: b[0]?.batteryCode }
  }
  return { entityType: entityType as string, entityId, entityLabel: undefined }
}
