import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { maintenanceLogs } from "@/lib/schema"
import { maintenanceLogsQuerySchema } from "@/lib/validation"
import { z } from "zod"
import { sql, desc, and, eq, ilike } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const searchParams = Object.fromEntries(url.searchParams)
    const params = maintenanceLogsQuerySchema.parse(searchParams)

    const { action, entityType, entityId, page, limit } = params
    const offset = (page - 1) * limit

    const conditions = []
    if (action) conditions.push(ilike(maintenanceLogs.action, `%${action}%`))
    if (entityType) conditions.push(eq(maintenanceLogs.entityType, entityType))
    if (entityId) conditions.push(eq(maintenanceLogs.entityId, entityId))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, totalRow] = await Promise.all([
      db
        .select()
        .from(maintenanceLogs)
        .where(where)
        .orderBy(desc(maintenanceLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(maintenanceLogs).where(where),
    ])

    const total = totalRow[0]?.total ?? 0

    return NextResponse.json({
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
