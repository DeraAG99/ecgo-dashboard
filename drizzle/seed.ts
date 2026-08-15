import { db } from "@/lib/db"
import { cabinets, slots, transactions, checkins } from "@/lib/schema"
import { evaluateCheckIn } from "@/lib/checkin/evaluateCheckin"
import { faker } from "@faker-js/faker"

const JAKARTA_CENTER = { lat: -6.2, lng: 106.82 }

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
  await db.delete(checkins)
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

    const lat = JAKARTA_CENTER.lat + (Math.random() - 0.5) * 0.3
    const lng = JAKARTA_CENTER.lng + (Math.random() - 0.5) * 0.4
    const radiusM = faker.number.int({ min: 100, max: 300 })

    const result = await db
      .insert(cabinets)
      .values({
        id: code,
        code,
        branch,
        status,
        totalSlots: 12,
        lat,
        lng,
        radiusM,
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

async function seedCheckIns(count: number = 20) {
  const now = new Date()
  const cabinetRows = await db
    .select({
      id: cabinets.id,
      branch: cabinets.branch,
      lat: cabinets.lat,
      lng: cabinets.lng,
      radiusM: cabinets.radiusM,
      status: cabinets.status,
    })
    .from(cabinets)

  const branches = cabinetRows
    .filter((c) => c.lat != null && c.lng != null && c.radiusM != null)
    .map((c) => ({
      id: c.id,
      name: c.branch,
      lat: c.lat!,
      lng: c.lng!,
      radiusM: c.radiusM!,
      active: c.status !== "MAINTENANCE",
    }))

  if (branches.length === 0) {
    console.log("No cabinets with coordinates, skip check-in seeding.")
    return
  }

  for (let i = 0; i < count; i++) {
    const userId = `U-${String(faker.number.int({ min: 1000, max: 9999 })).padStart(4, "0")}`
    const accuracyM =
      Math.random() < 0.2
        ? faker.number.int({ min: 101, max: 300 })
        : faker.number.int({ min: 5, max: 40 })

    let lat: number
    let lng: number

    if (Math.random() < 0.5) {
      const center = branches[Math.floor(Math.random() * branches.length)]!
      const offset = center.radiusM * 0.4
      const dLat = offset / 111320
      const dLng = offset / (111320 * Math.cos((center.lat * Math.PI) / 180))
      lat = center.lat + (Math.random() - 0.5) * 2 * dLat
      lng = center.lng + (Math.random() - 0.5) * 2 * dLng
    } else {
      lat = JAKARTA_CENTER.lat + (Math.random() - 0.5) * 0.3
      lng = JAKARTA_CENTER.lng + (Math.random() - 0.5) * 0.4
    }

    const result = evaluateCheckIn(
      { userId, lat, lng, accuracyM, at: now.toISOString() },
      branches
    )

    await db.insert(checkins).values({
      id: `ci-${String(i + 1).padStart(4, "0")}-${faker.string.alphanumeric(4)}`,
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
      createdAt: faker.date.recent(7, now),
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

  console.log("Seeding check-ins...")
  await seedCheckIns(20)

  console.log("Seeding complete!")
  process.exit(0)
}

main().catch((error) => {
  console.error("Seeding failed:", error)
  process.exit(1)
})