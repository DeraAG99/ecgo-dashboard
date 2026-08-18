import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

import SlotMaintenanceTable from "./SlotMaintenanceTable"

const cab = { id: "CB-001", code: "CB-001", branch: "Kemayoran" }

function mockFetchSlots() {
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    if (url === "/api/dashboard/cabinets") {
      return Promise.resolve({ ok: true, json: async () => ({ cabinets: [cab] }) })
    }
    return Promise.resolve({ ok: true, json: async () => ({ slots: [{ id: "slot-1", slotNumber: 3, state: "FAULT", soc: 0 }] }) })
  }) as unknown as typeof fetch
}

describe("SlotMaintenanceTable", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render fault/locked slots from API", async () => {
    globalThis.fetch = mockFetchSlots()
    render(<SlotMaintenanceTable />)

    expect(await screen.findByText("CB-001")).toBeInTheDocument()
    expect(screen.getByText("Kemayoran")).toBeInTheDocument()
    expect(screen.getByText("Fault")).toBeInTheDocument()
    expect(screen.getByText(/1 slot/)).toBeInTheDocument()
    expect(screen.getByText("Reset → EMPTY")).toBeInTheDocument()
  })

  it("should show empty state when no problem slots", async () => {
    globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url === "/api/dashboard/cabinets") {
        return Promise.resolve({ ok: true, json: async () => ({ cabinets: [cab] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ slots: [{ id: "slot-1", slotNumber: 1, state: "FULL", soc: 100 }] }) })
    }) as unknown as typeof fetch
    render(<SlotMaintenanceTable />)

    expect(await screen.findByText("Tidak ada slot problem.")).toBeInTheDocument()
  })

  it("should cancel slot action", async () => {
    globalThis.fetch = mockFetchSlots()
    render(<SlotMaintenanceTable />)
    await screen.findByText("CB-001")

    fireEvent.change(screen.getAllByRole("combobox")[0]!, { target: { value: "RESET" } })
    expect(screen.getByText("Konfirmasi Aksi Slot")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Batal" }))
    expect(screen.queryByText("Konfirmasi Aksi Slot")).not.toBeInTheDocument()
  })

  it("should confirm action and update slot state", async () => {
    globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url === "/api/dashboard/cabinets") {
        return Promise.resolve({ ok: true, json: async () => ({ cabinets: [cab] }) })
      }
      if (url.startsWith("/api/dashboard/maintenance/slots/")) {
        return Promise.resolve({ ok: true, json: async () => ({ newState: "EMPTY" }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ slots: [{ id: "slot-1", slotNumber: 3, state: "FAULT", soc: 0 }] }) })
    }) as unknown as typeof fetch

    render(<SlotMaintenanceTable />)
    await screen.findByText("CB-001")

    fireEvent.change(screen.getAllByRole("combobox")[0]!, { target: { value: "RESET" } })
    expect(screen.getByText("Konfirmasi Aksi Slot")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Konfirmasi" }))
    expect(await screen.findByText("Kosong")).toBeInTheDocument()
  })
})
