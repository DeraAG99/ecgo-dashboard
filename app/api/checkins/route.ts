import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cabinets, checkins } from "@/lib/schema"
import { checkInSchema, checkInsQuerySchema } from "@/lib/validation"
import { evaluateCheckIn } from "@/lib/checkin/evaluateCheckin"
import { randomUUID } from "crypto"
import { sql } from "drizzle-orm"
import { z } from "zod"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheckInRow = Record<string, any> & {
  id: string
  userId: string
  lat: number
  lng: number
  accuracyM: number
  result: "VALID" | "OUT_OF_RANGE" | "REJECTED"
  reason: string | null
  branchId: string | null
  branchCode: string | null
  branchName: string | null
  distanceM: number | null
  createdAt: Date
  _total: number
}

export async function POST(req: NextRequest) {
  try {
    const body = checkInSchema.parse(await req.json())
    const { userId, lat, lng, accuracyM } = body

    const cabinetRows = await db.execute(sql`
      SELECT id, branch, lat, lng, radius_m, status
      FROM ${cabinets}
      WHERE lat IS NOT NULL AND lng IS NOT NULL AND radius_m IS NOT NULL
    `)

    const rows = cabinetRows.rows as {
      id: string
      branch: string
      lat: number
      lng: number
      radius_m: number
      status: string
    }[]

    const branches = rows.map((c) => ({
      id: c.id,
      name: c.branch,
      lat: c.lat,
      lng: c.lng,
      radiusM: c.radius_m,
      active: c.status !== "MAINTENANCE",
    }))

    const result = evaluateCheckIn(
      { userId, lat, lng, accuracyM, at: new Date().toISOString() },
      branches
    )

    const inserted = await db
      .insert(checkins)
      .values({
        id: `ci-${randomUUID().slice(0, 13)}`,
        userId,
        lat,
        lng,
        accuracyM,
        result: result.status,
        reason: result.status === "REJECTED" ? result.reason : null,
        branchId:
          result.status === "VALID"
            ? result.branchId
            : result.status === "OUT_OF_RANGE"
            ? result.nearestBranchId
            : null,
        distanceM:
          result.status === "VALID" || result.status === "OUT_OF_RANGE"
            ? result.distanceM
            : null,
      })
      .returning()

    const record = inserted[0]
    const branchRow = record?.branchId
      ? rows.find((r) => r.id === record.branchId)
      : null

    return NextResponse.json(
      {
        checkIn: {
          ...record,
          branch: branchRow
            ? { id: branchRow.id, code: branchRow.id, name: branchRow.branch }
            : null,
        },
        result,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const params = checkInsQuerySchema.parse(Object.fromEntries(url.searchParams))
    const { userId, result, page, limit } = params
    const offset = (page - 1) * limit

    const userCond = userId ? sql`ci.user_id = ${userId}` : sql`TRUE`
    const resultCond = result ? sql`ci.result = ${result}` : sql`TRUE`

    const rawResults = await db.execute(sql`
      SELECT
        ci.id,
        ci.user_id as "userId",
        ci.lat,
        ci.lng,
        ci.accuracy_m as "accuracyM",
        ci.result,
        ci.reason,
        ci.branch_id as "branchId",
        ci.distance_m as "distanceM",
        ci.created_at as "createdAt",
        c.code as "branchCode",
        c.branch as "branchName",
        COUNT(*) OVER() as "_total"
      FROM ${checkins} ci
      LEFT JOIN ${cabinets} c ON c.id = ci.branch_id
      WHERE ${userCond} AND ${resultCond}
      ORDER BY ci.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const rows = rawResults.rows as unknown as CheckInRow[]
    const data = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      lat: row.lat,
      lng: row.lng,
      accuracyM: row.accuracyM,
      result: row.result,
      reason: row.reason,
      distanceM: row.distanceM,
      createdAt: row.createdAt,
      branch: row.branchId
        ? { id: row.branchId, code: row.branchCode, name: row.branchName }
        : null,
    }))

    const firstRow = rows[0]
    const total = firstRow?._total ?? 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({ data, total, page, totalPages })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
