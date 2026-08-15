import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import TransactionsPage from "./page"

const pushMock = vi.fn()
const searchParamsMock = { value: "" }

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(searchParamsMock.value),
  useRouter: () => ({ push: pushMock }),
}))

const txRow = {
  id: "tx-1",
  cabinetId: "CB-001",
  cabinetCode: "CB-001",
  branch: "Jakarta",
  userId: "U-1",
  oldBatteryId: "B-1",
  newBatteryId: "B-2",
  swappedAt: new Date("2026-08-14T10:00:00Z"),
}

const cabinetOption = { id: "CB-001", code: "CB-001", branch: "Jakarta" }

function mockFetch() {
  return vi.fn((url: string) => {
    if (String(url).includes("/api/cabinets")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [cabinetOption], total: 1, totalPages: 1 }),
      })
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ data: [txRow], total: 1, totalPages: 1 }),
    })
  })
}

describe("TransactionsPage", () => {
  beforeEach(() => {
    searchParamsMock.value = ""
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render transactions and cabinet options", async () => {
    globalThis.fetch = mockFetch() as unknown as typeof fetch
    render(<TransactionsPage />)

    expect(await screen.findByText("U-1")).toBeInTheDocument()
    expect(screen.getByText("CB-001 — Jakarta")).toBeInTheDocument()
    expect(screen.getAllByText("Sukses").length).toBeGreaterThan(0)
  })

  it("should fetch transactions with cabinetId after selecting a cabinet", async () => {
    const fetchMock = mockFetch()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    render(<TransactionsPage />)

    await screen.findByText("U-1")
    const cabinetSelect = screen.getAllByRole("combobox")[0]!
    fireEvent.change(cabinetSelect, { target: { value: "CB-001" } })

    await waitFor(() => {
      expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("cabinetId=CB-001"))).toBe(true)
    })
  })

  it("should push startDate and endDate to URL when date filter changes", async () => {
    globalThis.fetch = mockFetch() as unknown as typeof fetch
    const { container } = render(<TransactionsPage />)

    await screen.findByText("U-1")
    const dateInputs = container.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0]!, { target: { value: "2026-08-01" } })
    fireEvent.change(dateInputs[1]!, { target: { value: "2026-08-15" } })

    await waitFor(
      () => {
        expect(pushMock).toHaveBeenCalledWith(
          expect.stringContaining("startDate=2026-08-01")
        )
        expect(pushMock).toHaveBeenCalledWith(
          expect.stringContaining("endDate=2026-08-15")
        )
      },
      { timeout: 2000 }
    )
  })
})
