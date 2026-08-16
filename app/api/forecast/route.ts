import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { transactions, cabinets } from "@/lib/schema"
import { sql } from "drizzle-orm"
import { z } from "zod"
import { jakartaDateKey } from "@/lib/time"

const forecastQuerySchema = z.object({
  branch: z.string().optional(),
  days: z.coerce.number().int().min(1).max(14).default(7),
})

type ProfileRow = { dow: number; hour: number; cnt: number }
type CabinetRow = { id: string; code: string; branch: string; daily_avg: number }

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const params = forecastQuerySchema.parse(Object.fromEntries(url.searchParams))
    const { branch, days } = params

    const branchFilter = branch ? sql`AND c.branch = ${branch}` : sql``

    const [profileResult, daysResult, actualResult, cabinetResult] = await Promise.all([
      db.execute<ProfileRow>(sql`
        SELECT
          EXTRACT(DOW FROM t.swapped_at)::int AS dow,
          EXTRACT(HOUR FROM t.swapped_at)::int AS hour,
          COUNT(*)::int AS cnt
        FROM ${transactions} t
        LEFT JOIN ${cabinets} c ON c.id = t.cabinet_id
        WHERE t.swapped_at > NOW() - INTERVAL '60 days'
          ${branchFilter}
        GROUP BY 1, 2
      `),
      db.execute<{ days: number }>(sql`
        SELECT COUNT(DISTINCT date_trunc('day', t.swapped_at))::int AS days
        FROM ${transactions} t
        LEFT JOIN ${cabinets} c ON c.id = t.cabinet_id
        WHERE t.swapped_at > NOW() - INTERVAL '60 days'
          ${branchFilter}
      `),
      db.execute<{ date: string; swaps: number }>(sql`
        SELECT to_char(date_trunc('day', t.swapped_at), 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS swaps
        FROM ${transactions} t
        LEFT JOIN ${cabinets} c ON c.id = t.cabinet_id
        WHERE t.swapped_at >= date_trunc('day', NOW()) - INTERVAL '${sql.raw(String(days))} days'
          AND t.swapped_at < date_trunc('day', NOW()) + INTERVAL '1 day'
          ${branchFilter}
        GROUP BY 1
        ORDER BY 1
      `),
      db.execute<CabinetRow>(sql`
        SELECT c.id, c.code, c.branch,
          COUNT(*)::float / GREATEST(COUNT(DISTINCT date_trunc('day', t.swapped_at)), 1) AS daily_avg
        FROM ${transactions} t
        JOIN ${cabinets} c ON c.id = t.cabinet_id
        WHERE t.swapped_at > NOW() - INTERVAL '60 days'
          ${branchFilter}
        GROUP BY c.id, c.code, c.branch
        ORDER BY daily_avg DESC
      `),
    ])

    const distinctDays = daysResult.rows[0]?.days ?? 1
    const weeks = Math.max(distinctDays / 7, 1)

    const profile: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    profileResult.rows.forEach((r) => {
      profile[r.dow]![r.hour] = r.cnt / weeks
    })

    const hourlyPattern = Array.from({ length: 24 }, (_, hour) => {
      const avg = profile.reduce((sum, dayProfile) => sum + (dayProfile[hour] ?? 0), 0) / 7
      return { hour, avg: Math.round(avg * 10) / 10 }
    })

    const peak = hourlyPattern.reduce((best, h) => (h.avg > (best?.avg ?? -1) ? h : best), hourlyPattern[0]!)

    const forecastDaily: { date: string; predicted: number }[] = []
    for (let d = 1; d <= days; d++) {
      const key = jakartaDateKey(new Date(Date.now() + d * 86400000))
      const dow = new Date(`${key}T00:00:00+07:00`).getUTCDay()
      const sum = profile[dow]!.reduce((acc, v) => acc + v, 0)
      forecastDaily.push({ date: key, predicted: Math.round(sum) })
    }

    const historicalDaily = actualResult.rows.map((r) => ({ date: r.date, swaps: r.swaps }))
    const totalActual = historicalDaily.reduce((acc, r) => acc + r.swaps, 0)
    const totalPredicted = forecastDaily.reduce((acc, r) => acc + r.predicted, 0)

    const byCabinet = cabinetResult.rows.map((r) => ({
      id: r.id,
      code: r.code,
      branch: r.branch,
      dailyAvg: Math.round(r.daily_avg * 10) / 10,
      predictedTotal: Math.round(r.daily_avg * days),
    }))

    return NextResponse.json({
      branch: branch ?? null,
      days,
      totalActual,
      totalPredicted,
      avgPerDayActual: historicalDaily.length > 0 ? Math.round((totalActual / historicalDaily.length) * 10) / 10 : 0,
      avgPerDayPredicted: days > 0 ? Math.round((totalPredicted / days) * 10) / 10 : 0,
      peakHour: { hour: peak.hour, avg: peak.avg },
      historicalDaily,
      forecastDaily,
      hourlyPattern,
      byCabinet,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
