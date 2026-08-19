import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { transactions, cabinets } from "@/lib/schema"
import { sql, desc, eq, and, gte, lt } from "drizzle-orm"
import { wibStartOfDay, wibEndOfDayExclusive } from "@/lib/time"

const CSV_HEADER = "id,cabinetCode,branch,userId,oldBatteryId,newBatteryId,swappedAt"
const EXPORT_LIMIT = 1000

function escapeCsv(value: string | number | Date | null | undefined): string {
  const raw = value == null ? "" : value instanceof Date ? value.toISOString() : String(value)
  return `"${raw.replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const search = url.searchParams.get("search") || undefined
    const cabinetId = url.searchParams.get("cabinetId") || undefined
    const startDateParam = url.searchParams.get("startDate")
    const endDateParam = url.searchParams.get("endDate")
    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDateRaw = endDateParam ? new Date(endDateParam) : undefined
    const startDateValid = startDate && !Number.isNaN(startDate.getTime())
    const endDate = endDateRaw && !Number.isNaN(endDateRaw.getTime()) ? endDateRaw : undefined

    const conditions = []
    if (search) {
      conditions.push(
        sql`(${transactions.userId} ILIKE ${`%${search}%`} OR ${transactions.oldBatteryId} ILIKE ${`%${search}%`} OR ${transactions.newBatteryId} ILIKE ${`%${search}%`})`
      )
    }
    if (cabinetId) {
      conditions.push(eq(transactions.cabinetId, cabinetId))
    }
    if (startDateValid) {
      conditions.push(gte(transactions.swappedAt, wibStartOfDay(startDate!)))
    }
    if (endDate) {
      conditions.push(lt(transactions.swappedAt, wibEndOfDayExclusive(endDate)))
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        id: transactions.id,
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
      .limit(EXPORT_LIMIT)

    const lines = rows.map((row) =>
      [
        escapeCsv(row.id),
        escapeCsv(row.cabinetCode),
        escapeCsv(row.branch),
        escapeCsv(row.userId),
        escapeCsv(row.oldBatteryId),
        escapeCsv(row.newBatteryId),
        escapeCsv(row.swappedAt),
      ].join(",")
    )

    const csv = [CSV_HEADER, ...lines].join("\r\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
