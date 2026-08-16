import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

const { pathnameMock } = vi.hoisted(() => ({ pathnameMock: { value: "/dashboard" } }))

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
}))

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import DashboardLayout from "./DashboardLayout"

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders sidebar, topbar, and children", () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [], unread: 0 }) })
    render(
      <DashboardLayout>
        <div>Konten Halaman</div>
      </DashboardLayout>
    )
    expect(screen.getByText("Konten Halaman")).toBeInTheDocument()
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0)
  })
})
