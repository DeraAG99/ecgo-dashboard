import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cabinets, slots, transactions } from "@/lib/schema"
import { z } from "zod"
import { count, sql, eq, ilike, and, desc, gte } from "drizzle-orm"

const querySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ONLINE", "OFFLINE", "MAINTENANCE"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  sortBy: z.enum(["swapCount24h", "code", "lastHeartbeat"]).optional().default("swapCount24h"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
})

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const searchParams = Object.fromEntries(url.searchParams)
    const params = querySchema.parse(searchParams)

    const { search, status, page, limit, sortBy, sortOrder } = params
    const offset = (page - 1) * limit

    const whereConditions: any[] = []

    if (search) {
      whereConditions.push(
        sql`${ilike(cabinets.code, sql`%{search}%`)} OR ${ilike(cabinets.branch, sql`%{search}%`)}`
      )
    }

    if (status) {
      whereConditions.push(eq(cabinets.status, status))
    }

    const cabinetData = await db
      .select({
        id: cabinets.id,
        code: cabinets.code,
        branch: cabinets.branch,
        status: cabinets.status,
        totalSlots: cabinets.totalSlots,
        lastHeartbeat: cabinets.lastHeartbeat,
        filledSlots: sql<number>`(
          SELECT COUNT(*) FROM slots 
          WHERE cabinet_id = ${cabinets.id} AND state IN ('FULL', 'CHARGING')
        )`,
        swapCount24h: sql<number>`(
          SELECT COUNT(*) FROM transactions 
          WHERE cabinet_id = ${cabinets.id} 
          AND swapped_at > NOW() - INTERVAL '24 hours'
        )`,
      })
      .from(cabinets)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(sortOrder === "desc" ? desc(sql`${sortBy}`) : sql`${sortBy}`)
      .offset(offset)
      .limit(limit)

    const totalResult = await db
      .select({ total: count() })
      .from(cabinets)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

    const total = totalResult[0]?.total || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: cabinetData,
      total,
      page,
      totalPages,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}