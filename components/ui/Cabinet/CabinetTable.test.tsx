import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import CabinetTable from "./CabinetTable"

const pushMock = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: pushMock }),
}))

const cabinetRow = {
  id: "CB-001",
  code: "CB-001",
  branch: "Jakarta Pusat",
  status: "ONLINE",
  filledSlots: 4,
  totalSlots: 12,
  swapCount24h: 22,
  lastHeartbeat: new Date("2026-08-14T10:00:00Z"),
}

function mockFetch(data: { data: unknown[]; total: number; totalPages: number }) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => data })
}

describe("CabinetTable", () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render cabinet rows from API", async () => {
    globalThis.fetch = mockFetch({ data: [cabinetRow], total: 1, totalPages: 1 })
    render(<CabinetTable />)

    expect(await screen.findByText("CB-001")).toBeInTheDocument()
    expect(screen.getByText("Jakarta Pusat")).toBeInTheDocument()
    expect(screen.getAllByText("ONLINE").length).toBeGreaterThan(0)
    expect(screen.getByText("22")).toBeInTheDocument()
    expect(screen.getByText("4/12")).toBeInTheDocument()
  })

  it("should show empty state when no data", async () => {
    globalThis.fetch = mockFetch({ data: [], total: 0, totalPages: 0 })
    render(<CabinetTable />)

    expect(await screen.findByText("Tidak ada data cabinet")).toBeInTheDocument()
  })

  it("should show error message on failed request", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<CabinetTable />)

    expect(await screen.findByText("Gagal memuat data cabinet")).toBeInTheDocument()
  })

  it("should disable Previous button on first page", async () => {
    globalThis.fetch = mockFetch({ data: [cabinetRow], total: 1, totalPages: 1 })
    render(<CabinetTable />)

    await screen.findByText("CB-001")
    await waitFor(() => {
      expect(screen.getByText("Previous")).toBeDisabled()
    })
  })

  it("should push search param after debounce", async () => {
    globalThis.fetch = mockFetch({ data: [cabinetRow], total: 1, totalPages: 1 })
    render(<CabinetTable />)

    await screen.findByText("CB-001")
    fireEvent.change(screen.getByPlaceholderText("Cari kode cabinet atau cabang..."), {
      target: { value: "CB-00" },
    })
    await waitFor(
      () => {
        expect(pushMock).toHaveBeenCalledWith("/dashboard/cabinets?search=CB-00")
      },
      { timeout: 2000 }
    )
  })

  it("should push status param on select change", async () => {
    globalThis.fetch = mockFetch({ data: [cabinetRow], total: 1, totalPages: 1 })
    render(<CabinetTable />)

    await screen.findByText("CB-001")
    fireEvent.change(screen.getByDisplayValue("Status: ALL"), { target: { value: "OFFLINE" } })
    expect(pushMock).toHaveBeenCalledWith("/dashboard/cabinets?status=OFFLINE")
  })

  it("should navigate pages with Next and Previous", async () => {
    globalThis.fetch = mockFetch({ data: [cabinetRow], total: 30, totalPages: 3 })
    render(<CabinetTable />)

    await screen.findByText("CB-001")
    const fetchCalls = () => (globalThis.fetch as ReturnType<typeof mockFetch>).mock.calls.length
    const initialCalls = fetchCalls()

    fireEvent.click(screen.getByText("Next"))
    await waitFor(() => {
      expect(fetchCalls()).toBe(initialCalls + 1)
    })
    expect(screen.getByText("Hal 2 / 3")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Previous"))
    await waitFor(() => {
      expect(fetchCalls()).toBe(initialCalls + 2)
    })
    expect(screen.getByText("Hal 1 / 3")).toBeInTheDocument()
  })
})
