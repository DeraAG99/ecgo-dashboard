import { db } from "@/lib/db"
import { workOrders, type NewWorkOrder, type Alert } from "@/lib/schema"
import { addMaintenanceLog } from "./log"

export const ENTITY_TYPE_BY_ALERT: Record<Alert["type"], string> = {
  CABINET_OFFLINE: "CABINET",
  SLOT_FAULT: "SLOT",
  BATTERY_LOW: "BATTERY",
  SWAP_ANOMALY: "CABINET",
}

const ENTITY_LABEL_BY_ALERT: Record<string, (alert: Alert) => string> = {
  CABINET_OFFLINE: (a) => `Cabinet ${a.entityId ?? ""}`,
  SLOT_FAULT: (a) => `Slot ${a.entityId ?? ""}`,
  BATTERY_LOW: (a) => `Baterai ${a.entityId ?? ""}`,
  SWAP_ANOMALY: (a) => `Cabinet ${a.entityId ?? ""}`,
}

export function mapAlertPriority(severity: Alert["severity"]): NewWorkOrder["priority"] {
  if (severity === "CRITICAL") return "HIGH"
  if (severity === "WARNING") return "MEDIUM"
  return "LOW"
}

export async function createWorkOrderFromAlert(alertId: string) {
  const alert = await db.query.alerts.findFirst({
    where: (a, { eq }) => eq(a.id, alertId),
  })
  if (!alert) {
    throw new Error("Alert not found")
  }

  const entityType = ENTITY_TYPE_BY_ALERT[alert.type]
  const entityId = alert.entityId
  if (!entityId) {
    throw new Error("Alert has no entity id")
  }

  const priority = mapAlertPriority(alert.severity)
  const entityLabel = ENTITY_LABEL_BY_ALERT[alert.type]?.(alert)

  const row: NewWorkOrder = {
    id: `wo-${crypto.randomUUID()}`,
    alertId: alert.id,
    entityType,
    entityId,
    priority,
    status: "OPEN",
    title: alert.title,
    description: alert.message,
  }

  await db.insert(workOrders).values(row)

  await addMaintenanceLog({
    action: "WO_CREATED_FROM_ALERT",
    entityType,
    entityId,
    entityLabel,
    detail: `priority=${priority}`,
  })

  return row
}
