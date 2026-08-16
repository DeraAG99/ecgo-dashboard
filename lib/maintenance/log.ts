import { db } from "@/lib/db"
import { maintenanceLogs, type NewMaintenanceLog } from "@/lib/schema"

export interface AddMaintenanceLogParams {
  action: string
  entityType: string
  entityId?: string | null
  entityLabel?: string
  detail?: string
}

export async function addMaintenanceLog(params: AddMaintenanceLogParams): Promise<NewMaintenanceLog> {
  const row: NewMaintenanceLog = {
    id: `ml-${crypto.randomUUID()}`,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    entityLabel: params.entityLabel ?? null,
    detail: params.detail ?? null,
  }
  await db.insert(maintenanceLogs).values(row)
  return row
}
