import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import CheckInsPage from "./page"

const cabinetOption = {
  id: "CB-001",
  code: "CB-001",
  branch: "Jakarta",
  status: "ONLINE",
  lat: -6.2,
  lng: 106.82,
  radiusM: 200,
}

const historyRow = {
  id: "ci-abc123",
  userId: "U-0001",
  lat: -6.2001,
  lng: 106.82,
  accuracyM: 15,
  result: "VALID",
  reason: null,
  distanceM: 11,
  createdAt: "2026-08-15T00:00:00Z",
  branch: { id: "CB-001", code: "CB-001", name: "Jakarta" },
}

function mockFetch() {
  return vi.fn((url: string, init?: RequestInit) => {
    if (String(url).includes("/api/dashboard/cabinets")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [cabinetOption], total: 1, totalPages: 1 }),
      })
    }
    if (String(url).includes("/api/dashboard/checkins")) {
      if (init?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            checkIn: {
              id: "ci-new001",
              branch: { id: "CB-001", code: "CB-001", name: "Jakarta" },
            },
            result: {
              status: "VALID",
              branchId: "CB-001",
              branchName: "Jakarta",
              distanceM: 11,
            },
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [historyRow], total: 1, totalPages: 1 }),
      })
    }
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
}

describe("CheckInsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render title, cabinet options, and check-in history", async () => {
    globalThis.fetch = mockFetch() as unknown as typeof fetch
    render(<CheckInsPage />)

    expect(screen.getByRole("heading", { name: "Check-in" })).toBeInTheDocument()
    expect(await screen.findByText("U-0001")).toBeInTheDocument()
    expect(screen.getByText("Jakarta (CB-001)")).toBeInTheDocument()
    expect(screen.getByText(/Swap Baterai/)).toBeInTheDocument()
    const swapHint = screen.getByText(/harus/)
    expect(swapHint.textContent).toContain("VALID")
  })

  it("should prefill lat/lng and show distance when a cabinet target is selected", async () => {
    globalThis.fetch = mockFetch() as unknown as typeof fetch
    render(<CheckInsPage />)

    const select = (await screen.findByDisplayValue(
      "Pilih cabinet target..."
    )) as HTMLSelectElement
    fireEvent.change(select, { target: { value: "CB-001" } })

    await waitFor(() => {
      expect(screen.getByDisplayValue("-6.2")).toBeInTheDocument()
      expect(screen.getByDisplayValue("106.82")).toBeInTheDocument()
    })
    const distanceInfo = screen.getByText(/Jarak ke target:/)
    expect(distanceInfo.textContent).toContain("0 m")
    expect(distanceInfo.textContent).toContain("/ Radius: 200 m")
    expect(distanceInfo.textContent).toContain("dalam radius")
  })

  it("should show swap section after a VALID check-in", async () => {
    globalThis.fetch = mockFetch() as unknown as typeof fetch
    render(<CheckInsPage />)

    const select = (await screen.findByDisplayValue(
      "Pilih cabinet target..."
    )) as HTMLSelectElement
    fireEvent.change(select, { target: { value: "CB-001" } })

    fireEvent.change(screen.getByPlaceholderText("U-1234"), {
      target: { value: "U-0001" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Check-in" }))

    const validInfo = await screen.findByText(/Lokasi valid di/)
    expect(validInfo.textContent).toContain("Jakarta")
    expect(screen.getByText("Lakukan Swap")).toBeInTheDocument()
  })
})
