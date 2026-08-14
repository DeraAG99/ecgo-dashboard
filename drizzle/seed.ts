import { db } from "@/lib/db"
import { cabinets, slots, transactions } from "@/lib/schema"
import { faker } from "@faker-js/faker"

const BRANCHES = [
  "Kemayoran",
  "Sunter",
  "Cakung",
  "Grogol",
  "Depok",
  "Bekasi",
  "Jakarta Pusat",
  "Jakarta Timur",
]

async function clearData() {
  await db.delete(transactions)
  await db.delete(slots)
  await db.delete(cabinets)
}

async function seedCabinets(count: number = 50) {
  const cabinetIds: string[] = []

  for (let i = 0; i < count; i++) {
    const code = `CB-${String(i + 1).padStart(3, "0")}`
    const branch = faker.helpers.arrayElement(BRANCHES)
    const status: "ONLINE" | "OFFLINE" | "MAINTENANCE" = 
      Math.random() < 0.7
        ? "ONLINE"
        : Math.random() < 0.9
        ? "OFFLINE"
        : "MAINTENANCE"
    
    const now = new Date()
    const lastHeartbeat =
      status === "OFFLINE"
        ? faker.date.past(60, now)
        : faker.date.recent(7, now)

    const result = await db
      .insert(cabinets)
      .values({
        id: code,
        code,
        branch,
        status,
        totalSlots: 12,
        lastHeartbeat,
      })
      .returning()

    if (result[0]?.id) {
      cabinetIds.push(result[0].id)
    }
  }

  return cabinetIds
}

async function seedSlots(cabinetIds: string[]) {
  for (const cabinetId of cabinetIds) {
    for (let i = 1; i <= 12; i++) {
      const rand = Math.random()
      const state: "EMPTY" | "CHARGING" | "FULL" | "LOCKED" | "FAULT" =
        rand < 0.2
          ? "EMPTY"
          : rand < 0.4
          ? "CHARGING"
          : rand < 0.7
          ? "FULL"
          : rand < 0.85
          ? "LOCKED"
          : "FAULT"

      const soc = state === "EMPTY" ? null : Math.floor(Math.random() * 80 + 20)
      const lastUpdated = faker.date.recent(7)

      await db.insert(slots).values({
        id: `${cabinetId}-slot-${i}`,
        cabinetId,
        slotNumber: i,
        state,
        soc,
        lastUpdated,
      })
    }
  }
}

async function seedTransactions(cabinetIds: string[], count: number = 20000) {
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const cabinetId = faker.helpers.arrayElement(cabinetIds)

    const hour = Math.floor(Math.random() * 24)
    const minute = faker.number.int({ min: 0, max: 59 })
    const second = faker.number.int({ min: 0, max: 59 })

    const swappedAt = new Date(now)
    swappedAt.setHours(hour, minute, second, 0)

    const daysAgo = faker.number.int({ min: 0, max: 30 })
    swappedAt.setDate(swappedAt.getDate() - daysAgo)

    const userId = `U-${String(faker.number.int({ min: 1000, max: 9999 })).padStart(4, "0")}`

    await db.insert(transactions).values({
      id: `tx-${String(i + 1).padStart(6, "0")}`,
      cabinetId,
      userId,
      oldBatteryId: `BATT-${faker.string.alphanumeric({ length: 8 }).toUpperCase()}`,
      newBatteryId: `BATT-${faker.string.alphanumeric({ length: 8 }).toUpperCase()}`,
      swappedAt,
    })
  }
}

async function main() {
  console.log("Clearing existing data...")
  await clearData()

  console.log("Seeding cabinets...")
  const cabinetIds = await seedCabinets(50)

  console.log("Seeding slots...")
  await seedSlots(cabinetIds)

  console.log("Seeding transactions...")
  await seedTransactions(cabinetIds, 20000)

  console.log("Seeding complete!")
  process.exit(0)
}

main().catch((error) => {
  console.error("Seeding failed:", error)
  process.exit(1)
})