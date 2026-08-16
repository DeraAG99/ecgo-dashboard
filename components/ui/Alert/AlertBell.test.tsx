import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import AlertBell from "./AlertBell"

const alerts = [
  {
    id: "al-1",
    type: "CABINET_OFFLINE" as const,
    severity: "CRITICAL" as const,
    title: "CB-001 offline",
    createdAt: new Date("2026-08-16T02:00:00Z"),
    read: false,
  },
  {
    id: "al-2",
    type: "SWAP_ANOMALY" as const,
    severity: "INFO" as const,
    title: "Lonjakan swap",
    createdAt: null,
    read: false,
  },
]

describe("AlertBell", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: alerts, unread: 2 }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("shows unread badge", async () => {
    render(<AlertBell />)
    expect(await screen.findByText("2")).toBeInTheDocument()
  })

  it("opens dropdown and shows recent alerts", async () => {
    render(<AlertBell />)
    fireEvent.click(screen.getByLabelText("Notifikasi"))

    expect(await screen.findByText("CB-001 offline")).toBeInTheDocument()
    expect(screen.getByText("2 belum dibaca")).toBeInTheDocument()
    expect(screen.getByText("Lihat semua notifikasi").closest("a")?.getAttribute("href")).toBe(
      "/dashboard/alerts"
    )
  })

  it("shows empty message when no recent alerts", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [], unread: 0 }) })
    render(<AlertBell />)
    fireEvent.click(screen.getByLabelText("Notifikasi"))

    expect(await screen.findByText("Tidak ada notifikasi baru.")).toBeInTheDocument()
  })

  it("marks an alert as read and removes it", async () => {
    globalThis.fetch = vi.fn()
      .mockImplementationOnce(async () => ({ ok: true, json: async () => ({ data: alerts, unread: 2 }) }))
      .mockImplementationOnce(async () => ({ ok: true }))
    render(<AlertBell />)
    fireEvent.click(screen.getByLabelText("Notifikasi"))

    await screen.findByText("CB-001 offline")
    fireEvent.click(screen.getAllByText("Baca")[0]!)
    await waitFor(() => {
      expect(screen.getByText("1 belum dibaca")).toBeInTheDocument()
    })
  })
})
