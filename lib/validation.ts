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
