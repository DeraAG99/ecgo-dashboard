import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { transactions, cabinets } from "@/lib/schema"
import { transactionsQuerySchema } from "@/lib/validation"
import { z } from "zod"
import { sql, desc, eq, and, gte, lt } from "drizzle-orm"
import { jakartaDayStart, jakartaDayEndExclusive } from "@/lib/time"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const searchParams = Object.fromEntries(url.searchParams)
    const params = transactionsQuerySchema.parse(searchParams)

    const { search, cabinetId, startDate, endDate, page, limit } = params
    const offset = (page - 1) * limit

    const conditions = []
    if (search) {
      conditions.push(
        sql`(${transactions.userId} ILIKE ${`%${search}%`} OR ${transactions.oldBatteryId} ILIKE ${`%${search}%`} OR ${transactions.newBatteryId} ILIKE ${`%${search}%`})`
      )
    }
    if (cabinetId) {
      conditions.push(eq(transactions.cabinetId, cabinetId))
    }
    if (startDate) {
      conditions.push(gte(transactions.swappedAt, jakartaDayStart(startDate)))
    }
    if (endDate) {
      conditions.push(lt(transactions.swappedAt, jakartaDayEndExclusive(endDate)))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: transactions.id,
          cabinetId: transactions.cabinetId,
          cabinetCode: cabinets.code,
          branch: cabinets.branch,
          userId: transactions.userId,
          oldBatteryId: transactions.oldBatteryId,
          newBatteryId: transactions.newBatteryId,
          swappedAt: transactions.swappedAt,
        })
        .from(transactions)
        .leftJoin(cabinets, eq(transactions.cabinetId, cabinets.id))
        .where(where)
        .orderBy(desc(transactions.swappedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(transactions)
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
