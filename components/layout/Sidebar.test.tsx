import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

const { pathnameMock } = vi.hoisted(() => ({ pathnameMock: { value: "/dashboard" } }))

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
}))

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

import Sidebar from "./Sidebar"

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders all nav items", () => {
    render(<Sidebar />)
    for (const label of ["Dashboard", "Cabinet List", "Transactions", "Maintenance", "Settings"]) {
      expect(screen.getByText(label)).toBeTruthy()
    }
  })

  it("links to dashboard routes", () => {
    render(<Sidebar />)
    const link = screen.getByText("Cabinet List").closest("a")
    expect(link?.getAttribute("href")).toBe("/dashboard/cabinets")
  })

  it("marks dashboard active only on exact /dashboard", () => {
    pathnameMock.value = "/dashboard/cabinets"
    render(<Sidebar />)
    const dashboard = screen.getByText("Dashboard").closest("a")
    const cabinets = screen.getByText("Cabinet List").closest("a")
    expect(dashboard?.className).not.toContain("font-bold")
    expect(cabinets?.className).toContain("font-bold")
  })
})
