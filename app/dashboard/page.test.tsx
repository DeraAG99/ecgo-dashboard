import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { cloneElement, isValidElement } from "react"
import type { ReactNode } from "react"
import Dashboard from "./page"

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div style={{ width: 600, height: 300 }}>
        {isValidElement(children) ? cloneElement(children, { width: 600, height: 300 }) : children}
      </div>
    ),
  }
})

const dashboardData = {
  totalCabinets: 50,
  onlineCabinets: 45,
  offlineCabinets: 3,
  maintenanceCabinets: 2,
  totalSwapToday: 120,
  totalSwap7d: 840,
  batteriesAvailable: 200,
  batteriesCharging: 40,
  batteriesEmpty: 300,
  batteriesLocked: 5,
  batteriesFault: 3,
  weeklyTrend: [
    { day: "Mon", total: 90 },
    { day: "Tue", total: 110 },
    { day: "Wed", total: 140 },
    { day: "Thu", total: 120 },
    { day: "Fri", total: 150 },
    { day: "Sat", total: 130 },
    { day: "Sun", total: 100 },
  ],
  alerts: [
    { id: "CB-002", code: "CB-002", branch: "Bandung", status: "OFFLINE", lastHeartbeat: null },
  ],
}

function mockFetch(data: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => data })
}

describe("Dashboard", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render KPI cards and weekly trend chart from API", async () => {
    globalThis.fetch = mockFetch(dashboardData)
    const { container } = render(<Dashboard />)

    expect(await screen.findByText("Total Swap Hari Ini")).toBeInTheDocument()
    expect(screen.getByText("Cabinet Aktif")).toBeInTheDocument()
    expect(screen.getByText("Baterai Tersedia")).toBeInTheDocument()
    expect(screen.getByText("Swap 7 Hari")).toBeInTheDocument()

    expect(screen.getAllByText("120").length).toBeGreaterThan(0)
    expect(screen.getByText("45")).toBeInTheDocument()
    expect(screen.getAllByText("200").length).toBeGreaterThan(0)
    expect(screen.getAllByText("840").length).toBeGreaterThan(0)

    expect(screen.getByText("Tren Swap Mingguan")).toBeInTheDocument()
    expect(container.querySelector(".recharts-bar")).toBeTruthy()
    expect(screen.getByText("CB-002")).toBeInTheDocument()
  })

  it("should show error message on failed request", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<Dashboard />)

    expect(await screen.findByText("Gagal memuat data dashboard")).toBeInTheDocument()
  })
})
