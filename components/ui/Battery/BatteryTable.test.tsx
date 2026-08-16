import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import BatteryTable from "./BatteryTable"
import BatteryStatusBadge from "./BatteryStatusBadge"

const pushMock = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: pushMock }),
}))

const batteryRow = {
  id: "bat-0001",
  batteryCode: "BATT-ABCD1234",
  status: "RETIRED",
  cycleCount: 480,
  health: 12,
  cabinetId: "CB-001",
  cabinetCode: "CB-001",
  branch: "Kemayoran",
  lastSwapAt: new Date("2026-08-14T10:00:00Z"),
}

function mockFetch(data: { data: unknown[]; total: number; totalPages: number }) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => data })
}

describe("BatteryStatusBadge", () => {
  it("should render label for each status", () => {
    render(<BatteryStatusBadge status="AVAILABLE" />)
    expect(screen.getByText("AVAILABLE")).toBeInTheDocument()
  })

  it("should fallback to raw label for unknown status", () => {
    render(<BatteryStatusBadge status="UNKNOWN" />)
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument()
  })
})

describe("BatteryTable", () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render battery rows from API", async () => {
    globalThis.fetch = mockFetch({ data: [batteryRow], total: 1, totalPages: 1 })
    render(<BatteryTable />)

    expect(await screen.findByText("BATT-ABCD1234")).toBeInTheDocument()
    expect(screen.getByText("Kemayoran (CB-001)")).toBeInTheDocument()
    expect(screen.getAllByText("RETIRED").length).toBeGreaterThan(0)
    expect(screen.getByText("480")).toBeInTheDocument()
  })

  it("should show low-health warning banner", async () => {
    globalThis.fetch = mockFetch({ data: [batteryRow], total: 1, totalPages: 1 })
    render(<BatteryTable />)

    expect(
      await screen.findByText(/1 baterai pada halaman ini berada di bawah ambang kesehatan/)
    ).toBeInTheDocument()
  })

  it("should show empty state when no data", async () => {
    globalThis.fetch = mockFetch({ data: [], total: 0, totalPages: 0 })
    render(<BatteryTable />)

    expect(await screen.findByText("Tidak ada data baterai")).toBeInTheDocument()
  })

  it("should show error message on failed request", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<BatteryTable />)

    expect(await screen.findByText("Gagal memuat data baterai")).toBeInTheDocument()
  })

  it("should push search param after debounce", async () => {
    globalThis.fetch = mockFetch({ data: [batteryRow], total: 1, totalPages: 1 })
    render(<BatteryTable />)

    await screen.findByText("BATT-ABCD1234")
    fireEvent.change(screen.getByPlaceholderText("Cari kode baterai atau cabang..."), {
      target: { value: "BATT" },
    })
    await waitFor(
      () => {
        expect(pushMock).toHaveBeenCalledWith("/dashboard/batteries?search=BATT")
      },
      { timeout: 2000 }
    )
  })

  it("should navigate pages", async () => {
    globalThis.fetch = mockFetch({ data: [batteryRow], total: 50, totalPages: 3 })
    render(<BatteryTable />)

    await screen.findByText("BATT-ABCD1234")
    fireEvent.click(screen.getByText("Next"))
    await waitFor(() => {
      expect(screen.getByText("Hal 2 / 3")).toBeInTheDocument()
    })
  })
})
