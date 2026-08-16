import { z } from "zod"

export const cabinetsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ONLINE", "OFFLINE", "MAINTENANCE"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["swapCount24h", "code", "lastHeartbeat"]).optional().default("swapCount24h"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
})

export const cabinetParamsSchema = z.object({
  id: z.string().min(1),
})

export const transactionsQuerySchema = z.object({
  search: z.string().optional(),
  cabinetId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const checkInSchema = z.object({
  userId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().min(0).max(500),
})

export const checkInsQuerySchema = z.object({
  userId: z.string().optional(),
  result: z.enum(["VALID", "OUT_OF_RANGE", "REJECTED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const swapSchema = z.object({
  userId: z.string().min(1),
  cabinetId: z.string().min(1),
})

export const batteriesQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["AVAILABLE", "IN_USE", "CHARGING", "FAULT", "RETIRED"]).optional(),
  minHealth: z.coerce.number().int().min(0).max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["batteryCode", "cycleCount", "health", "lastSwapAt"]).optional().default("batteryCode"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
})

export const batteryParamsSchema = z.object({
  id: z.string().min(1),
})

export const alertsQuerySchema = z.object({
  type: z.enum(["CABINET_OFFLINE", "SLOT_FAULT", "BATTERY_LOW", "SWAP_ANOMALY"]).optional(),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
  read: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const workOrderStatusEnum = z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "DONE", "CANCELLED"])
export const workOrderPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"])
export const entityTypeEnum = z.enum(["CABINET", "SLOT", "BATTERY"])

export const workOrdersQuerySchema = z.object({
  status: workOrderStatusEnum.optional(),
  priority: workOrderPriorityEnum.optional(),
  assignedTo: z.string().optional(),
  entityType: entityTypeEnum.optional(),
  entityId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const workOrderCreateSchema = z.object({
  entityType: entityTypeEnum,
  entityId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: workOrderPriorityEnum.default("MEDIUM"),
  alertId: z.string().optional(),
})

export const workOrderUpdateSchema = z.object({
  status: workOrderStatusEnum.optional(),
  assignedTo: z.string().nullable().optional(),
  priority: workOrderPriorityEnum.optional(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const maintenanceActionSchema = z.object({
  action: z.enum(["LOCK", "UNLOCK", "RESET", "SET_ONLINE", "SET_OFFLINE", "SET_MAINTENANCE", "RETIRE", "FAULT", "REACTIVATE"]),
  reason: z.string().optional(),
})

export const maintenanceLogsQuerySchema = z.object({
  action: z.string().optional(),
  entityType: entityTypeEnum.optional(),
  entityId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
})
