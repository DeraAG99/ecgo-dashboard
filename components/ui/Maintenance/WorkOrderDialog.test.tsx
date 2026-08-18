import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

import { WorkOrderDialog } from "./WorkOrderDialog"

const baseProps = {
  open: true,
  onClose: vi.fn(),
  value: null,
  onAssigned: vi.fn().mockResolvedValue(undefined),
  onUpdated: vi.fn(),
}

const woRow = {
  id: "wo-1",
  alertId: null,
  entityType: "CABINET",
  entityId: "CB-001",
  entityLabel: "CB-001",
  title: "Ganti fan",
  description: null,
  priority: "HIGH",
  status: "OPEN",
  assignedTo: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
}

describe("WorkOrderDialog", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should create a manual work order", async () => {
    const onClose = vi.fn()
    const onUpdated = vi.fn()
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "wo-9" }) })

    render(<WorkOrderDialog {...baseProps} onClose={onClose} onUpdated={onUpdated} />)

    expect(screen.getByText("Buat Work Order")).toBeInTheDocument()
    const textboxes = screen.getAllByRole("textbox")
    fireEvent.change(textboxes[0]!, { target: { value: "Ganti fan" } })
    fireEvent.change(textboxes[1]!, { target: { value: "CB-001" } })
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/dashboard/maintenance/work-orders",
        expect.objectContaining({ method: "POST" })
      )
    })
    expect(onUpdated).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it("should create a work order from alert", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      if (String(url).includes("/api/dashboard/alerts")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: [{ id: "al-1", title: "Cab offline", type: "CABINET_OFFLINE", severity: "WARNING" }] }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({ id: "wo-8" }) })
    }) as unknown as typeof fetch

    render(<WorkOrderDialog {...baseProps} />)

    fireEvent.click(screen.getByRole("button", { name: "Dari Alert" }))
    expect(await screen.findByText("[WARNING] Cab offline")).toBeInTheDocument()

    const alertSelect = screen.getAllByRole("combobox")[0]!
    fireEvent.change(alertSelect, { target: { value: "al-1" } })
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/dashboard/maintenance/work-orders?source=alert",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("should show detail and assign technician", async () => {
    const onAssigned = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<WorkOrderDialog {...baseProps} value={woRow as never} onAssigned={onAssigned} onClose={onClose} />)

    expect(screen.getByText("Detail Work Order")).toBeInTheDocument()
    expect(screen.getByText("Ganti fan")).toBeInTheDocument()
    expect(screen.getByText("Tinggi")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Simpan" })).not.toBeInTheDocument()

    const technicianSelect = screen.getAllByRole("combobox")[0]!
    fireEvent.change(technicianSelect, { target: { value: "Andi" } })
    fireEvent.click(screen.getByRole("button", { name: "Assign" }))

    await waitFor(() => {
      expect(onAssigned).toHaveBeenCalledWith("wo-1", "Andi")
    })
    expect(onClose).toHaveBeenCalled()
  })

  it("should call onClose when cancelled", () => {
    const onClose = vi.fn()
    render(<WorkOrderDialog {...baseProps} onClose={onClose} />)

    fireEvent.click(screen.getByRole("button", { name: "Batal" }))
    expect(onClose).toHaveBeenCalled()
  })
})
