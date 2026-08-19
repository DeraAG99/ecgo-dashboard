import { pgTable, text, integer, timestamp, pgEnum, index, doublePrecision, boolean } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const statusEnum = pgEnum("status", ["ONLINE", "OFFLINE", "MAINTENANCE"])
export const slotStateEnum = pgEnum("slot_state", ["EMPTY", "CHARGING", "FULL", "LOCKED", "FAULT"])
export const checkInResultEnum = pgEnum("check_in_result", ["VALID", "OUT_OF_RANGE", "REJECTED"])
export const checkInReasonEnum = pgEnum("check_in_reason", ["LOW_ACCURACY", "INVALID_COORDINATE", "NO_BRANCH_ASSIGNED"])
export const batteryStatusEnum = pgEnum("battery_status", ["AVAILABLE", "IN_USE", "CHARGING", "FAULT", "RETIRED"])
export const alertTypeEnum = pgEnum("alert_type", ["CABINET_OFFLINE", "SLOT_FAULT", "BATTERY_LOW", "SWAP_ANOMALY"])
export const alertSeverityEnum = pgEnum("alert_severity", ["INFO", "WARNING", "CRITICAL"])

export const workOrderPriorityEnum = pgEnum("work_order_priority", ["LOW", "MEDIUM", "HIGH"])
export const workOrderStatusEnum = pgEnum("work_order_status", ["OPEN", "ASSIGNED", "IN_PROGRESS", "DONE", "CANCELLED"])

export const cabinets = pgTable(
  "cabinets",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    branch: text("branch").notNull(),
    status: statusEnum("status").default("ONLINE"),
    totalSlots: integer("total_slots").default(12),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    radiusM: integer("radius_m").default(150),
    lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("cabinets_status_idx").on(table.status)],
)

export type Cabinet = typeof cabinets.$inferSelect
export type NewCabinet = typeof cabinets.$inferInsert

export const slots = pgTable(
  "slots",
  {
    id: text("id").primaryKey(),
    cabinetId: text("cabinet_id").references(() => cabinets.id).notNull(),
    slotNumber: integer("slot_number").notNull(),
    state: slotStateEnum("state").default("EMPTY"),
    soc: integer("soc"),
    lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("slots_cabinet_id_idx").on(table.cabinetId)],
)

export type Slot = typeof slots.$inferSelect
export type NewSlot = typeof slots.$inferInsert

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    cabinetId: text("cabinet_id").references(() => cabinets.id).notNull(),
    userId: text("user_id").notNull(),
    oldBatteryId: text("old_battery_id").notNull(),
    newBatteryId: text("new_battery_id").notNull(),
    swappedAt: timestamp("swapped_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("transactions_cabinet_swapped_idx").on(table.cabinetId, table.swappedAt)],
)

export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert

export const checkins = pgTable(
  "checkins",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    accuracyM: integer("accuracy_m").notNull(),
    result: checkInResultEnum("result").notNull(),
    reason: checkInReasonEnum("reason"),
    branchId: text("branch_id").references(() => cabinets.id),
    distanceM: integer("distance_m"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("checkins_user_created_idx").on(table.userId, table.createdAt)],
)

export type CheckIn = typeof checkins.$inferSelect
export type NewCheckIn = typeof checkins.$inferInsert

export const batteries = pgTable(
  "batteries",
  {
    id: text("id").primaryKey(),
    batteryCode: text("battery_code").notNull().unique(),
    status: batteryStatusEnum("status").default("AVAILABLE"),
    cycleCount: integer("cycle_count").default(0),
    health: integer("health").default(100),
    cabinetId: text("cabinet_id").references(() => cabinets.id),
    lastSwapAt: timestamp("last_swap_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("batteries_status_idx").on(table.status),
    index("batteries_cabinet_idx").on(table.cabinetId),
  ],
)

export type Battery = typeof batteries.$inferSelect
export type NewBattery = typeof batteries.$inferInsert

export const batteriesRelations = relations(batteries, ({ one }) => ({
  cabinet: one(cabinets, { fields: [batteries.cabinetId], references: [cabinets.id] }),
}))

export const cabinetsRelations = relations(cabinets, ({ many }) => ({
  batteries: many(batteries),
}))

export const alerts = pgTable(
  "alerts",
  {
    id: text("id").primaryKey(),
    type: alertTypeEnum("type").notNull(),
    severity: alertSeverityEnum("severity").notNull().default("WARNING"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    entityId: text("entity_id"),
    read: boolean("read").default(false),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("alerts_type_idx").on(table.type),
    index("alerts_read_idx").on(table.read),
    index("alerts_entity_idx").on(table.entityId),
  ],
)

export type Alert = typeof alerts.$inferSelect
export type NewAlert = typeof alerts.$inferInsert

export const workOrders = pgTable(
  "work_orders",
  {
    id: text("id").primaryKey(),
    alertId: text("alert_id").references(() => alerts.id, { onDelete: "set null" }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    priority: workOrderPriorityEnum("priority").notNull().default("MEDIUM"),
    status: workOrderStatusEnum("status").notNull().default("OPEN"),
    title: text("title").notNull(),
    description: text("description"),
    assignedTo: text("assigned_to"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("work_orders_status_idx").on(table.status),
    index("work_orders_priority_idx").on(table.priority),
    index("work_orders_assignee_idx").on(table.assignedTo),
    index("work_orders_entity_idx").on(table.entityType, table.entityId),
  ],
)

export type WorkOrder = typeof workOrders.$inferSelect
export type NewWorkOrder = typeof workOrders.$inferInsert

export const maintenanceLogs = pgTable(
  "maintenance_logs",
  {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    entityLabel: text("entity_label"),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("maintenance_logs_entity_idx").on(table.entityType, table.entityId),
    index("maintenance_logs_created_idx").on(table.createdAt),
  ],
)

export type MaintenanceLog = typeof maintenanceLogs.$inferSelect
export type NewMaintenanceLog = typeof maintenanceLogs.$inferInsert
