import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

const pushMock = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: pushMock }),
}))

import WorkOrderList from "./WorkOrderList"

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

function mockFetch(data: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => data })
}

describe("WorkOrderList", () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render work orders from API", async () => {
    globalThis.fetch = mockFetch({ data: [woRow], total: 1, totalPages: 1 })
    render(<WorkOrderList />)

    expect(await screen.findByText("Ganti fan")).toBeInTheDocument()
    expect(screen.getByText("CB-001")).toBeInTheDocument()
    expect(screen.getByText("Tinggi")).toBeInTheDocument()
    expect(screen.getAllByText("Terbuka").length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "Assign→" })).toBeInTheDocument()
  })

  it("should show error message on failed request", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<WorkOrderList />)

    expect(await screen.findByText("Gagal memuat work order")).toBeInTheDocument()
  })

  it("should push status filter on flow button click", async () => {
    globalThis.fetch = mockFetch({ data: [woRow], total: 1, totalPages: 1 })
    render(<WorkOrderList />)

    await screen.findByText("Ganti fan")
    fireEvent.click(screen.getByRole("button", { name: "Selesai" }))
    expect(pushMock).toHaveBeenCalledWith("/dashboard/maintenance?tab=work-orders&status=DONE")
  })

  it("should advance status via quick action button", async () => {
    globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
      if (String(input).includes("/api/maintenance/work-orders/wo-1")) {
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [{ ...woRow, status: "IN_PROGRESS" }], total: 1, totalPages: 1 }) })
    }) as unknown as typeof fetch

    render(<WorkOrderList />)
    await screen.findByText("Ganti fan")

    fireEvent.click(screen.getByRole("button", { name: "Selesai→" }))
    await waitFor(() => {
      expect(screen.getAllByText("Selesai").length).toBe(2)
    })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/maintenance/work-orders/wo-1",
      expect.objectContaining({ method: "PATCH" })
    )
  })
})
