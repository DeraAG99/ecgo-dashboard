import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

const pushMock = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: pushMock }),
}))

import BatteryMaintenanceTable from "./BatteryMaintenanceTable"

const battery = {
  id: "b-1",
  batteryCode: "BATT-001",
  status: "FAULT",
  cycleCount: 100,
  health: 15,
  cabinetId: "CB-001",
  cabinetCode: "CB-001",
  branch: "Kemayoran",
  lastSwapAt: new Date(),
}

function mockFetchBatteries() {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => ({ batteries: [battery] }) })
}

describe("BatteryMaintenanceTable", () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render batteries needing maintenance from API", async () => {
    globalThis.fetch = mockFetchBatteries()
    render(<BatteryMaintenanceTable />)

    expect(await screen.findByText("BATT-001")).toBeInTheDocument()
    expect(screen.getAllByText("Fault").length).toBeGreaterThan(0)
    expect(screen.getByText("15%")).toBeInTheDocument()
    expect(screen.getByText("CB-001")).toBeInTheDocument()
    expect(screen.getByText("Reactivasi → AVAILABLE")).toBeInTheDocument()
  })

  it("should show error message on failed request", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<BatteryMaintenanceTable />)

    expect(await screen.findByText("Gagal memuat baterai")).toBeInTheDocument()
  })

  it("should push status filter on button click", async () => {
    globalThis.fetch = mockFetchBatteries()
    render(<BatteryMaintenanceTable />)

    await screen.findByText("BATT-001")
    fireEvent.click(screen.getByRole("button", { name: "Pensiun" }))
    expect(pushMock).toHaveBeenCalledWith("/maintenance?tab=batteries&status=RETIRED&page=1")
  })

  it("should show empty state when no batteries need maintenance", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ batteries: [] }) })
    render(<BatteryMaintenanceTable />)

    expect(await screen.findByText("Tidak ada baterai butuh perawatan.")).toBeInTheDocument()
  })

  it("should cancel battery action", async () => {
    globalThis.fetch = mockFetchBatteries()
    render(<BatteryMaintenanceTable />)
    await screen.findByText("BATT-001")

    fireEvent.change(screen.getAllByRole("combobox")[0]!, { target: { value: "REACTIVATE" } })
    expect(screen.getByText("Konfirmasi Aksi Baterai")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Batal" }))
    expect(screen.queryByText("Konfirmasi Aksi Baterai")).not.toBeInTheDocument()
  })
})
