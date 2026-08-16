import { describe, it, expect, vi, beforeEach } from "vitest"
import { render } from "@testing-library/react"
import L from "leaflet"
import type { MapCabinet } from "./CabinetMapTypes"

const mockChain = {
  addTo: vi.fn().mockReturnThis(),
  bindPopup: vi.fn().mockReturnThis(),
  addLayer: vi.fn().mockReturnThis(),
  clearLayers: vi.fn().mockReturnThis(),
}

vi.mock("leaflet", () => ({
  __esModule: true,
  default: {
    map: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      fitBounds: vi.fn(),
      whenReady: vi.fn((cb: () => void) => cb()),
      invalidateSize: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
    divIcon: vi.fn(() => "icon"),
    marker: vi.fn(() => mockChain),
    layerGroup: vi.fn(() => mockChain),
    circle: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
    latLngBounds: vi.fn(() => ({ pad: vi.fn().mockReturnThis() })),
  },
}))

import CabinetMap from "./CabinetMap"

const cabinets: MapCabinet[] = [
  {
    id: "CB-001",
    code: "CB-001",
    branch: "Kemayoran",
    status: "ONLINE",
    totalSlots: 12,
    filledSlots: 6,
    swapCount24h: 14,
    lastHeartbeat: new Date("2026-08-14T10:00:00Z"),
    lat: -6.2,
    lng: 106.82,
    radiusM: 150,
  },
]

describe("CabinetMap", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize the leaflet map and plot markers", () => {
    render(<CabinetMap cabinets={cabinets} />)
    expect(L.map).toHaveBeenCalled()
    expect(L.tileLayer).toHaveBeenCalled()
    expect(L.marker).toHaveBeenCalledTimes(1)
    expect(L.circle).toHaveBeenCalledTimes(1)
    expect(L.layerGroup).toHaveBeenCalled()
    expect(L.latLngBounds).toHaveBeenCalled()
  })

  it("should not initialize map when no valid coordinates", () => {
    render(
      <CabinetMap
        cabinets={[
          { ...cabinets[0]!, id: "CB-001", lat: null, lng: null, radiusM: null },
          { ...cabinets[0]!, id: "CB-002", lat: 0, lng: 0, radiusM: 0 },
        ]}
      />,
    )
    expect(L.map).not.toHaveBeenCalled()
  })
})
