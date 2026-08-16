import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

const pushMock = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: pushMock }),
}))

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import AlertList from "./AlertList"

const alerts = [
  {
    id: "al-1",
    type: "CABINET_OFFLINE" as const,
    severity: "CRITICAL" as const,
    title: "CB-001 offline",
    message: "Tidak ada heartbeat 5 menit terakhir",
    entityId: "CB-001",
    read: false,
    createdAt: new Date("2026-08-16T02:00:00Z"),
  },
  {
    id: "al-2",
    type: "SLOT_FAULT" as const,
    severity: "WARNING" as const,
    title: "Slot 3 fault",
    message: "Slot 3 CB-002 error",
    entityId: "CB-002",
    read: true,
    createdAt: null,
  },
]

function mockApi({ data, total, totalPages, unread }: { data: unknown[]; total: number; totalPages: number; unread: number }) {
  return vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    if (init && init.method && init.method !== "GET") return { ok: true } as Response
    return { ok: true, json: async () => ({ data, total, totalPages, unread }) } as Response
  })
}

function footerText(): string {
  const footer = screen.getByText((_content, node) => {
    const p = node as HTMLElement | null
    return p?.nodeName === "P" && Boolean(p.textContent?.includes("belum dibaca"))
  })
  return footer.textContent ?? ""
}

describe("AlertList", () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render alerts with severity badge and unread count", async () => {
    globalThis.fetch = mockApi({ data: alerts, total: 2, totalPages: 1, unread: 1 })
    render(<AlertList />)

    expect(await screen.findByText("CB-001 offline")).toBeInTheDocument()
    expect(screen.getByText("Slot 3 fault")).toBeInTheDocument()
    expect(screen.getByText("CRITICAL")).toBeInTheDocument()
    expect(footerText()).toContain("1 belum dibaca")
  })

  it("should link battery alerts to battery detail page", async () => {
    globalThis.fetch = mockApi({ data: alerts, total: 2, totalPages: 1, unread: 1 })
    render(<AlertList />)

    await screen.findByText("CB-001 offline")
    const link = screen.getByText("CB-001 offline").closest("a")
    expect(link?.getAttribute("href")).toBe("/dashboard/cabinets/CB-001")
  })

  it("should show empty state when no alerts", async () => {
    globalThis.fetch = mockApi({ data: [], total: 0, totalPages: 0, unread: 0 })
    render(<AlertList />)

    expect(await screen.findByText(/Tidak ada notifikasi/)).toBeInTheDocument()
  })

  it("should show error message on failed request", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })
    render(<AlertList />)

    expect(await screen.findByText("Gagal memuat notifikasi")).toBeInTheDocument()
  })

  it("should push type filter param", async () => {
    globalThis.fetch = mockApi({ data: alerts, total: 2, totalPages: 1, unread: 1 })
    render(<AlertList />)

    await screen.findByText("CB-001 offline")
    fireEvent.click(screen.getByText("Baterai Lemah"))
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard/alerts?type=BATTERY_LOW")
    })
  })

  it("should run scan and mark all read", async () => {
    globalThis.fetch = vi.fn()
      .mockImplementationOnce(async () => ({ ok: true, json: async () => ({ data: alerts, total: 2, totalPages: 1, unread: 1 }) }))
      .mockImplementationOnce(async () => ({ ok: true }))
      .mockImplementationOnce(async () => ({ ok: true, json: async () => ({ data: alerts, total: 2, totalPages: 1, unread: 0 }) }))
    render(<AlertList />)

    await screen.findByText("CB-001 offline")
    fireEvent.click(screen.getByText("Scan Sekarang"))
    await waitFor(() => {
      expect(footerText()).toContain("0 belum dibaca")
    })
  })

  it("should mark one alert as read", async () => {
    globalThis.fetch = vi.fn()
      .mockImplementationOnce(async () => ({ ok: true, json: async () => ({ data: alerts, total: 2, totalPages: 1, unread: 1 }) }))
      .mockImplementationOnce(async () => ({ ok: true }))
    render(<AlertList />)

    await screen.findByText("CB-001 offline")
    fireEvent.click(screen.getAllByText("Tandai dibaca")[0]!)
    await waitFor(() => {
      expect(footerText()).toContain("0 belum dibaca")
    })
  })
})
