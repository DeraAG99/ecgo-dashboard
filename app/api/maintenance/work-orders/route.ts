import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cabinets, slots, batteries, workOrders } from "@/lib/schema"
import { workOrdersQuerySchema, workOrderCreateSchema } from "@/lib/validation"
import { z } from "zod"
import { sql, eq, desc, and, ilike } from "drizzle-orm"
import { addMaintenanceLog } from "@/lib/maintenance/log"
import { createWorkOrderFromAlert } from "@/lib/maintenance/createFromAlert"
import { resolveEntityForLog } from "@/lib/maintenance/entities"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const searchParams = Object.fromEntries(url.searchParams)
    const params = workOrdersQuerySchema.parse(searchParams)

    const { status, priority, assignedTo, entityType, entityId, search, page, limit } = params
    const offset = (page - 1) * limit

    const conditions = []
    if (status) conditions.push(eq(workOrders.status, status))
    if (priority) conditions.push(eq(workOrders.priority, priority))
    if (assignedTo) conditions.push(ilike(workOrders.assignedTo, `%${assignedTo}%`))
    if (entityType) conditions.push(eq(workOrders.entityType, entityType))
    if (entityId) conditions.push(eq(workOrders.entityId, entityId))
    if (search) conditions.push(ilike(workOrders.title, `%${search}%`))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows: Array<{
      id: string
      alertId: string | null
      entityType: string
      entityId: string
      title: string | null
      description: string | null
      priority: string
      status: string
      assignedTo: string | null
      notes: string | null
      createdAt: Date | null
      updatedAt: Date | null
      completedAt: Date | null
    }> = await db
      .select({
        id: workOrders.id,
        alertId: workOrders.alertId,
        entityType: workOrders.entityType,
        entityId: workOrders.entityId,
        title: workOrders.title,
        description: workOrders.description,
        priority: workOrders.priority,
        status: workOrders.status,
        assignedTo: workOrders.assignedTo,
        notes: workOrders.notes,
        createdAt: workOrders.createdAt,
        updatedAt: workOrders.updatedAt,
        completedAt: workOrders.completedAt,
      })
      .from(workOrders)
      .where(where)
      .orderBy(desc(workOrders.createdAt))
      .limit(limit)
      .offset(offset)

    const enriched = await Promise.all(
      rows.map(async (r) => {
        let entityLabel = r.entityId
        if (r.entityType === "CABINET" || r.entityType === "SWAP_ANOMALY") {
          const cab = await db.select({ code: cabinets.code }).from(cabinets).where(eq(cabinets.id, r.entityId)).limit(1)
          if (cab[0]) entityLabel = cab[0].code
        } else if (r.entityType === "SLOT") {
          const s = await db
            .select({ cabinetId: slots.cabinetId, slotNumber: slots.slotNumber })
            .from(slots)
            .where(eq(slots.id, r.entityId))
            .limit(1)
          if (s[0]) entityLabel = `Slot #${s[0].slotNumber}`
        } else if (r.entityType === "BATTERY") {
          const b = await db.select({ batteryCode: batteries.batteryCode }).from(batteries).where(eq(batteries.id, r.entityId)).limit(1)
          if (b[0]) entityLabel = b[0].batteryCode
        }
        return { ...r, entityLabel, createdAt: r.createdAt, updatedAt: r.updatedAt, completedAt: r.completedAt }
      })
    )

    const totalRow = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(workOrders)
      .where(where)
    const total = totalRow[0]?.total ?? 0

    return NextResponse.json({
      data: enriched,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const source = body.source ?? "manual"

    if (source === "alert" && body.alertId) {
      const created = await createWorkOrderFromAlert(body.alertId)
      return NextResponse.json(created, { status: 201 })
    }

    const params = workOrderCreateSchema.parse(body)
    const { entityLabel } = await resolveEntityForLog({ entityType: params.entityType, entityId: params.entityId })

    const row = {
      id: `wo-${crypto.randomUUID()}`,
      alertId: params.alertId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      title: params.title,
      description: params.description ?? null,
      priority: params.priority,
      status: "OPEN" as const,
      assignedTo: null,
      notes: null,
    } as const
    const inserted = await db.insert(workOrders).values(row).returning()

    await addMaintenanceLog({
      action: "WO_CREATED",
      entityType: params.entityType,
      entityId: params.entityId,
      entityLabel,
      detail: `priority=${params.priority}`,
    })

    return NextResponse.json(inserted[0], { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: (error as Error).message ?? "Internal Server Error" }, { status: 500 })
  }
}
