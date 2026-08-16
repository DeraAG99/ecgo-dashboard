export type MapCabinet = {
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
