import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

const pushMock = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: pushMock }),
}))

import CabinetMaintenanceTable from "./CabinetMaintenanceTable"

const cab = {
  id: "CB-001",
  code: "CB-001",
  branch: "Kemayoran",
  status: "ONLINE",
  totalSlots: 12,
  lastHeartbeat: new Date(),
}

function mockFetchCabinet() {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => ({ cabinets: [cab] }) })
}

describe("CabinetMaintenanceTable", () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render cabinets from API", async () => {
    globalThis.fetch = mockFetchCabinet()
    render(<CabinetMaintenanceTable />)

    expect(await screen.findByText("CB-001")).toBeInTheDocument()
    expect(screen.getByText("Kemayoran")).toBeInTheDocument()
    expect(screen.getAllByText("Online").length).toBeGreaterThan(0)
    expect(screen.getByText("0/12")).toBeInTheDocument()
  })

  it("should show error message on failed request", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<CabinetMaintenanceTable />)

    expect(await screen.findByText("Gagal memuat cabinet")).toBeInTheDocument()
  })

  it("should confirm status change and update the row", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cabinets: [cab] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "OFFLINE" }) })

    render(<CabinetMaintenanceTable />)
    await screen.findByText("CB-001")

    fireEvent.change(screen.getAllByRole("combobox")[0]!, { target: { value: "OFFLINE" } })
    expect(screen.getByText("Ubah Status Cabinet")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Konfirmasi" }))
    expect(await screen.findByText("Offline")).toBeInTheDocument()
  })

  it("should cancel the status change", async () => {
    globalThis.fetch = mockFetchCabinet()
    render(<CabinetMaintenanceTable />)
    await screen.findByText("CB-001")

    fireEvent.change(screen.getAllByRole("combobox")[0]!, { target: { value: "OFFLINE" } })
    expect(screen.getByText("Ubah Status Cabinet")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Batal" }))
    expect(screen.queryByText("Ubah Status Cabinet")).not.toBeInTheDocument()
  })

  it("should show empty state when no cabinets", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ cabinets: [] }) })
    render(<CabinetMaintenanceTable />)

    expect(await screen.findByText("Tidak ada cabinet.")).toBeInTheDocument()
  })
})
