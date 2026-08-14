import { pgTable, text, integer, timestamp, pgEnum, index } from "drizzle-orm/pg-core"

export const statusEnum = pgEnum("status", ["ONLINE", "OFFLINE", "MAINTENANCE"])
export const slotStateEnum = pgEnum("slot_state", ["EMPTY", "CHARGING", "FULL", "LOCKED", "FAULT"])

export const cabinets = pgTable(
  "cabinets",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    branch: text("branch").notNull(),
    status: statusEnum("status").default("ONLINE"),
    totalSlots: integer("total_slots").default(12),
    lastHeartbeat: timestamp("last_heartbeat"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
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
    lastUpdated: timestamp("last_updated").defaultNow(),
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
    swappedAt: timestamp("swapped_at").defaultNow(),
  },
  (table) => [index("transactions_cabinet_swapped_idx").on(table.cabinetId, table.swappedAt)],
)

export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert