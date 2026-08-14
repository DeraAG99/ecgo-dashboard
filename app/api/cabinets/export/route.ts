import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cabinets, slots, transactions } from "@/lib/schema"
import { sql } from "drizzle-orm"

const CSV_HEADER = "code,branch,status,totalSlots,filledSlots,swapCount24h,lastHeartbeat"

interface ExportRow {
  code: string
  branch: string
  status: string
  totalSlots: number
  filledSlots: number
  swapCount24h: number
  lastHeartbeat: string | Date | null
}

function escapeCsv(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value)
  return `"${raw.replace(/"/g, '""')}"`
}

function formatTimestamp(value: unknown): string {
  if (value == null) return ""
  return value instanceof Date ? value.toISOString() : String(value)
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const search = url.searchParams.get("search") || undefined
    const status = url.searchParams.get("status") || undefined

    const searchCond = search
      ? sql`(c.code ILIKE ${`%${search}%`} OR c.branch ILIKE ${`%${search}%`})`
      : sql`TRUE`
    const statusCond = status ? sql`c.status = ${status}` : sql`TRUE`

    const rawResults = await db.execute(sql`
      SELECT
        c.code,
        c.branch,
        c.status,
        c.total_slots as "totalSlots",
        COALESCE(filled.cnt, 0) as "filledSlots",
        COALESCE(swaps.cnt, 0) as "swapCount24h",
        c.last_heartbeat as "lastHeartbeat"
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
      ORDER BY c.code ASC
    `)

    const raw = rawResults.rows as unknown as ExportRow[]
    const lines = raw.map((row) =>
      [
        escapeCsv(row.code),
        escapeCsv(row.branch),
        escapeCsv(row.status),
        escapeCsv(row.totalSlots),
        escapeCsv(row.filledSlots),
        escapeCsv(row.swapCount24h),
        escapeCsv(formatTimestamp(row.lastHeartbeat)),
      ].join(",")
    )

    const csv = [CSV_HEADER, ...lines].join("\r\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cabinets-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
