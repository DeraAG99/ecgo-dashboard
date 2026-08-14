export type CabinetStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE"

export type SlotState = "EMPTY" | "CHARGING" | "FULL" | "LOCKED" | "FAULT"

export type Cabinet = {
  id: string
  code: string
  branch: string
  status: CabinetStatus
  totalSlots: number
  lastHeartbeat: Date | null
  filledSlots?: number
  swapCount24h?: number
}

export type Slot = {
  id: string
  cabinetId: string
  slotNumber: number
  state: SlotState
  soc: number | null
  lastUpdated: Date
}

export type Transaction = {
  id: string
  cabinetId: string
  userId: string
  oldBatteryId: string
  newBatteryId: string
  swappedAt: Date
}

export type CabinetDetail = Cabinet & {
  slots: Slot[]
  swapHistory: Transaction[]
  chartData: { hour: string; count: number }[]
}

export type CabinetResponse = {
  data: Cabinet[]
  total: number
  page: number
  totalPages: number
}