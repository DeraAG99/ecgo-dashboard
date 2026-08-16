import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { batteries, cabinets } from "@/lib/schema"
import { batteriesQuerySchema } from "@/lib/validation"
import { z } from "zod"
import { sql, eq, and, asc, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const searchParams = Object.fromEntries(url.searchParams)
    const params = batteriesQuerySchema.parse(searchParams)

    const { search, status, minHealth, page, limit, sortBy, sortOrder } = params
    const offset = (page - 1) * limit

    const conditions = []
    if (search) {
      conditions.push(sql`(${batteries.batteryCode} ILIKE ${`%${search}%`} OR ${cabinets.branch} ILIKE ${`%${search}%`})`)
    }
    if (status) {
      conditions.push(eq(batteries.status, status))
    }
    if (minHealth != null) {
      conditions.push(sql`${batteries.health} <= ${minHealth}`)
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const orderByField =
      sortBy === "cycleCount"
        ? batteries.cycleCount
        : sortBy === "health"
        ? batteries.health
        : sortBy === "lastSwapAt"
        ? batteries.lastSwapAt
        : batteries.batteryCode
    const orderDirection = sortOrder === "desc" ? desc : asc

    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: batteries.id,
          batteryCode: batteries.batteryCode,
          status: batteries.status,
          cycleCount: batteries.cycleCount,
          health: batteries.health,
          cabinetId: batteries.cabinetId,
          cabinetCode: cabinets.code,
          branch: cabinets.branch,
          lastSwapAt: batteries.lastSwapAt,
          createdAt: batteries.createdAt,
        })
        .from(batteries)
        .leftJoin(cabinets, eq(batteries.cabinetId, cabinets.id))
        .where(where)
        .orderBy(orderDirection(orderByField))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(batteries)
        .where(where),
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
