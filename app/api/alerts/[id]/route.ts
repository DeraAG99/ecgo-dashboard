import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { alerts } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop() || ""
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const updated = await db
      .update(alerts)
      .set({ read: true })
      .where(eq(alerts.id, id))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
