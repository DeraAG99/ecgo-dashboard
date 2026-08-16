import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

import MaintenanceSummary from "./MaintenanceSummary"

const summaryData = {
  cabinets: { ONLINE: 10, OFFLINE: 1, MAINTENANCE: 2 },
  slots: { EMPTY: 100, CHARGING: 40, FULL: 30, LOCKED: 2, FAULT: 3 },
  slotFaultCount: 3,
  slotLockedCount: 2,
  batteries: { AVAILABLE: 50, IN_USE: 20, CHARGING: 10, FAULT: 4, RETIRED: 5 },
  batteryLowHealthCount: 6,
  batteryHealthBuckets: { "0-25": 2, "25-50": 4, "50-75": 10, "75-100": 73 },
  alerts: { unresolved: 8 },
  workOrders: { byStatus: { OPEN: 3, ASSIGNED: 2, IN_PROGRESS: 1, DONE: 10 }, openCount: 6 },
}

function mockFetch(data: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => data })
}

describe("MaintenanceSummary", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render summary cards and critical indicators from API", async () => {
    globalThis.fetch = mockFetch(summaryData)
    render(<MaintenanceSummary />)

    expect(await screen.findByText("Status Cabinet")).toBeInTheDocument()
    expect(screen.getByText("Health Baterai (bucket)")).toBeInTheDocument()
    expect(screen.getByText("Distribusi Slot")).toBeInTheDocument()
    expect(screen.getByText("Work Order by Status")).toBeInTheDocument()
    expect(screen.getByText("Indikator Kritis")).toBeInTheDocument()

    expect(screen.getByText("Fault slot: 3")).toBeInTheDocument()
    expect(screen.getByText("Locked slot: 2")).toBeInTheDocument()
    expect(screen.getByText("Baterai low health: 6")).toBeInTheDocument()
    expect(screen.getByText("Alert belum resolved: 8")).toBeInTheDocument()
    expect(screen.getByText("WO terbuka: 6")).toBeInTheDocument()
  })

  it("should show error message on failed request", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<MaintenanceSummary />)

    expect(await screen.findByText("Gagal memuat ringkasan")).toBeInTheDocument()
  })
})
