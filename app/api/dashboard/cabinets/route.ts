import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cabinets, slots, transactions } from "@/lib/schema"
import { cabinetsQuerySchema } from "@/lib/validation"
import { sql } from "drizzle-orm"
import { z } from "zod"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CabinetRow = Record<string, any> & {
  id: string
  code: string
  branch: string
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE"
  totalSlots: number
  lastHeartbeat: Date | null
  filledSlots: number
  swapCount24h: number
  _total: number
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const searchParams = Object.fromEntries(url.searchParams)
    const params = cabinetsQuerySchema.parse(searchParams)

    const { search, status, page, limit, sortBy, sortOrder } = params
    const offset = (page - 1) * limit

    const sortField = sortBy === "swapCount24h" ? "swap_count_24h" : sortBy === "code" ? "code" : "last_heartbeat"
    const sortDirection = sortOrder === "desc" ? "DESC" : "ASC"

    const searchCond = search
      ? sql`(c.code ILIKE ${`%${search}%`} OR c.branch ILIKE ${`%${search}%`})`
      : sql`TRUE`
    const statusCond = status ? sql`c.status = ${status}` : sql`TRUE`

    const rawResults = await db.execute(sql`
      WITH filtered_cabinets AS (
        SELECT 
          c.id,
          c.code,
          c.branch,
          c.status,
          c.total_slots,
          c.last_heartbeat,
          COALESCE(filled.cnt, 0) as filled_slots,
          COALESCE(swaps.cnt, 0) as swap_count_24h
        FROM ${cabinets} c
        LEFT JOIN LATERAL (
          SELECT COUNT(*) as cnt 
          FROM ${slots} s 
          WHERE s.cabinet_id = c.id AND s.state IN ('FULL', 'CHARGING')
        ) filled ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) as cnt 
          FROM ${transactions} t 
          WHERE t.cabinet_id = c.id AND t.swapped_at > NOW() - INTERVAL '24 hours'
        ) swaps ON true
        WHERE ${searchCond} AND ${statusCond}
      )
      SELECT 
        id, code, branch, status, total_slots as "totalSlots", last_heartbeat as "lastHeartbeat",
        filled_slots as "filledSlots", swap_count_24h as "swapCount24h",
        COUNT(*) OVER() as "_total"
      FROM filtered_cabinets
      ORDER BY ${sql.raw(sortField)} ${sql.raw(sortDirection)}
      LIMIT ${limit} OFFSET ${offset}
    `)

    const rows = rawResults.rows as unknown as CabinetRow[]
    const data = rows.map((row) => ({
      id: row.id,
      code: row.code,
      branch: row.branch,
      status: row.status,
      totalSlots: row.totalSlots,
      lastHeartbeat: row.lastHeartbeat,
      filledSlots: row.filledSlots,
      swapCount24h: row.swapCount24h,
    }))

    const firstRow = rows[0]
    const total = firstRow?._total ?? 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data,
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