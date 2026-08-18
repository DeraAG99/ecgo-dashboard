import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cabinets, checkins, slots, transactions } from "@/lib/schema"
import { swapSchema } from "@/lib/validation"
import { sql } from "drizzle-orm"
import { z } from "zod"

const BATTERY_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

function randomBatteryId(): string {
  let out = ""
  for (let i = 0; i < 8; i++) {
    out += BATTERY_CHARS[Math.floor(Math.random() * BATTERY_CHARS.length)]
  }
  return `BATT-${out}`
}

export async function POST(req: NextRequest) {
  try {
    const body = swapSchema.parse(await req.json())
    const { userId, cabinetId } = body

    const checkinResults = await db.execute(sql`
      SELECT ci.id, ci.branch_id as "branchId"
      FROM ${checkins} ci
      WHERE ci.user_id = ${userId} AND ci.result = 'VALID'
        AND ci.created_at > NOW() - INTERVAL '15 minutes'
      ORDER BY ci.created_at DESC
      LIMIT 1
    `)
    const checkin = checkinResults.rows[0] as
      | { id: string; branchId: string }
      | undefined

    if (!checkin) {
      return NextResponse.json(
        { error: "Belum ada check-in valid dalam 15 menit terakhir" },
        { status: 403 }
      )
    }

    const cabinetResults = await db.execute(sql`
      SELECT id, code, branch FROM ${cabinets} WHERE id = ${cabinetId}
    `)
    const cabinet = cabinetResults.rows[0] as
      | { id: string; code: string; branch: string }
      | undefined

    if (!cabinet) {
      return NextResponse.json({ error: "Cabinet tidak ditemukan" }, { status: 404 })
    }

    const branchResults = await db.execute(sql`
      SELECT branch FROM ${cabinets} WHERE id = ${checkin.branchId}
    `)
    const branchCabinet = branchResults.rows[0] as { branch: string } | undefined

    if (!branchCabinet || branchCabinet.branch !== cabinet.branch) {
      return NextResponse.json(
        { error: "Cabang cabinet tidak sesuai dengan lokasi check-in" },
        { status: 403 }
      )
    }

    const slotResults = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE state = 'FULL') as full_count,
        COUNT(*) FILTER (WHERE state = 'EMPTY') as empty_count
      FROM ${slots}
      WHERE cabinet_id = ${cabinetId}
    `)
    const counts = slotResults.rows[0] as
      | { full_count: string; empty_count: string }
      | undefined
    const fullCount = Number(counts?.full_count ?? 0)
    const emptyCount = Number(counts?.empty_count ?? 0)

    if (fullCount < 1 || emptyCount < 1) {
      return NextResponse.json(
        {
          error:
            "Slot tidak tersedia (butuh minimal 1 slot FULL dan 1 slot EMPTY)",
        },
        { status: 409 }
      )
    }

    const transactionId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const insertedTx = await db
      .insert(transactions)
      .values({
        id: transactionId,
        cabinetId,
        userId,
        oldBatteryId: randomBatteryId(),
        newBatteryId: randomBatteryId(),
      })
      .returning()

    const fullSlotResults = await db.execute(sql`
      SELECT id, slot_number as "slotNumber"
      FROM ${slots}
      WHERE cabinet_id = ${cabinetId} AND state = 'FULL'
      ORDER BY slot_number
      LIMIT 1
    `)
    const emptySlotResults = await db.execute(sql`
      SELECT id, slot_number as "slotNumber"
      FROM ${slots}
      WHERE cabinet_id = ${cabinetId} AND state = 'EMPTY'
      ORDER BY slot_number
      LIMIT 1
    `)
    const fullSlot = fullSlotResults.rows[0] as
      | { id: string; slotNumber: number }
      | undefined
    const emptySlot = emptySlotResults.rows[0] as
      | { id: string; slotNumber: number }
      | undefined

    if (fullSlot) {
      await db.execute(
        sql`UPDATE ${slots} SET state = 'EMPTY', soc = NULL, last_updated = NOW() WHERE id = ${fullSlot.id}`
      )
    }
    if (emptySlot) {
      await db.execute(
        sql`UPDATE ${slots} SET state = 'CHARGING', soc = ${Math.floor(Math.random() * 15 + 5)}, last_updated = NOW() WHERE id = ${emptySlot.id}`
      )
    }

    return NextResponse.json(
      {
        transaction: insertedTx[0],
        slotChanges: [
          fullSlot
            ? { slotNumber: fullSlot.slotNumber, from: "FULL", to: "EMPTY" }
            : null,
          emptySlot
            ? { slotNumber: emptySlot.slotNumber, from: "EMPTY", to: "CHARGING" }
            : null,
        ].filter(Boolean),
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
