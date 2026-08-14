import { z } from "zod"

export const cabinetsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ONLINE", "OFFLINE", "MAINTENANCE"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  sortBy: z.enum(["swapCount24h", "code", "lastHeartbeat"]).optional().default("swapCount24h"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
})

export const cabinetParamsSchema = z.object({
  id: z.string().min(1),
})

export const transactionsQuerySchema = z.object({
  search: z.string().optional(),
  cabinetId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
})
