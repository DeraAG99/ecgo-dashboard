import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

const pushMock = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: pushMock }),
}))

import MaintenanceLog from "./MaintenanceLog"

const logRow = {
  id: "ml-1",
  action: "CABINET_OFFLINE",
  entityType: "CABINET",
  entityId: "CB-001",
  entityLabel: "CB-001",
  detail: "prevStatus=ONLINE",
  createdAt: new Date(),
}

describe("MaintenanceLog", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render logs from API", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [logRow], total: 1, totalPages: 1 }) })
    render(<MaintenanceLog />)

    expect(await screen.findByText("CABINET_OFFLINE")).toBeInTheDocument()
    expect(screen.getByText("CB-001")).toBeInTheDocument()
    expect(screen.getByText("prevStatus=ONLINE")).toBeInTheDocument()
  })

  it("should show empty state when no logs", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [], total: 0, totalPages: 0 }) })
    render(<MaintenanceLog />)

    expect(await screen.findByText("Belum ada aktivitas maintenance.")).toBeInTheDocument()
  })

  it("should show error message on failed request", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<MaintenanceLog />)

    expect(await screen.findByText("Gagal memuat log")).toBeInTheDocument()
  })
})
