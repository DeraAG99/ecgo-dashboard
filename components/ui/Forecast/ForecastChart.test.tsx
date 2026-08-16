import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

const pushMock = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: pushMock }),
}))

import ForecastChart from "./ForecastChart"

const forecastData = {
  branch: null,
  days: 7,
  totalActual: 100,
  totalPredicted: 120,
  avgPerDayActual: 14.3,
  avgPerDayPredicted: 17.1,
  peakHour: { hour: 11, avg: 5 },
  historicalDaily: [
    { date: "2026-08-10", swaps: 10 },
    { date: "2026-08-11", swaps: 12 },
  ],
  forecastDaily: [
    { date: "2026-08-17", predicted: 14 },
    { date: "2026-08-18", predicted: 15 },
  ],
  hourlyPattern: [
    { hour: 8, avg: 1.2 },
    { hour: 11, avg: 5 },
  ],
  byCabinet: [
    { id: "CB-001", code: "CB-001", branch: "Kemayoran", dailyAvg: 3.2, predictedTotal: 22 },
  ],
}

function mockFetch(data: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => data })
}

describe("ForecastChart", () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render KPI cards and cabinet table from API", async () => {
    globalThis.fetch = mockFetch(forecastData)
    render(<ForecastChart />)

    expect(await screen.findByText("120")).toBeInTheDocument()
    expect(screen.getByText("100")).toBeInTheDocument()
    expect(screen.getByText("11:00 WIB")).toBeInTheDocument()
    expect(screen.getByText("CB-001")).toBeInTheDocument()
    expect(screen.getByText("Kemayoran")).toBeInTheDocument()
  })

  it("should render both chart sections", async () => {
    globalThis.fetch = mockFetch(forecastData)
    render(<ForecastChart />)

    expect(await screen.findByText("Swap Harian: Aktual vs Prediksi")).toBeInTheDocument()
    expect(screen.getByText("Pola Permintaan per Jam")).toBeInTheDocument()
    expect(screen.getByText("Proyeksi per Cabinet (Semua cabang)")).toBeInTheDocument()
  })

  it("should show error message on failed request", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<ForecastChart />)

    expect(await screen.findByText("Gagal memuat data forecast")).toBeInTheDocument()
  })

  it("should push days param on button click", async () => {
    globalThis.fetch = mockFetch(forecastData)
    render(<ForecastChart />)

    await screen.findByText("120")
    fireEvent.click(screen.getByText("14 hari"))
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard/forecast?days=14")
    })
  })
})
