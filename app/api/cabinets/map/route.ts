import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cabinets, slots, transactions } from "@/lib/schema"
import { sql } from "drizzle-orm"

type MapCabinetRow = {
  id: string
  code: string
  branch: string
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE"
  totalSlots: number
  filledSlots: number
  swapCount24h: number
  lastHeartbeat: Date | null
  lat: number | null
  lng: number | null
  radiusM: number | null
}

export async function GET() {
  try {
    const rows = await db.execute<MapCabinetRow>(sql`
      SELECT
        c.id,
        c.code,
        c.branch,
        c.status,
        c.total_slots as "totalSlots",
        c.last_heartbeat as "lastHeartbeat",
        c.lat,
        c.lng,
        c.radius_m as "radiusM",
        COALESCE(filled.cnt, 0) as "filledSlots",
        COALESCE(swaps.cnt, 0) as "swapCount24h"
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
    `)

    return NextResponse.json({ data: rows.rows })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
