import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { alerts } from "@/lib/schema"
import { alertsQuerySchema } from "@/lib/validation"
import { scanAlerts } from "@/lib/alerts/scanAlerts"
import { z } from "zod"
import { sql, eq, desc, and } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const searchParams = Object.fromEntries(url.searchParams)
    const params = alertsQuerySchema.parse(searchParams)

    const { type, severity, read, page, limit } = params
    const offset = (page - 1) * limit

    const conditions = []
    if (type) conditions.push(eq(alerts.type, type))
    if (severity) conditions.push(eq(alerts.severity, severity))
    if (read === "true") conditions.push(eq(alerts.read, true))
    if (read === "false") conditions.push(eq(alerts.read, false))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, totalRow, unreadRow] = await Promise.all([
      db
        .select()
        .from(alerts)
        .where(where)
        .orderBy(desc(alerts.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(alerts).where(where),
      db.select({ total: sql<number>`count(*)::int` }).from(alerts).where(eq(alerts.read, false)),
    ])

    const total = totalRow[0]?.total ?? 0
    const unread = unreadRow[0]?.total ?? 0

    return NextResponse.json({
      data: rows,
      total,
      unread,
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

export async function POST() {
  try {
    const result = await scanAlerts()
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    const result = await db
      .update(alerts)
      .set({ read: true })
      .where(and(eq(alerts.read, false)))
      .returning({ id: alerts.id })

    return NextResponse.json({ updated: result.length })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
