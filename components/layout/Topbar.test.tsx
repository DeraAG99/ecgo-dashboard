import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

const { pathnameMock } = vi.hoisted(() => ({ pathnameMock: { value: "/dashboard" } }))

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
}))

import Topbar from "./Topbar"

describe("Topbar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows Dashboard title on /dashboard", () => {
    pathnameMock.value = "/dashboard"
    render(<Topbar />)
    expect(screen.getByText("Dashboard")).toBeTruthy()
    expect(screen.queryByText("Detail")).toBeNull()
  })

  it("shows Cabinet List title on list page without Detail breadcrumb", () => {
    pathnameMock.value = "/dashboard/cabinets"
    render(<Topbar />)
    expect(screen.getByText("Cabinet List")).toBeTruthy()
    expect(screen.queryByText("Detail")).toBeNull()
  })

  it("shows Detail breadcrumb on cabinet detail page", () => {
    pathnameMock.value = "/dashboard/cabinets/CB-001"
    render(<Topbar />)
    expect(screen.getByText("Cabinet List")).toBeTruthy()
    expect(screen.getByText("Detail")).toBeTruthy()
  })

  it("falls back to Dashboard title on unknown path", () => {
    pathnameMock.value = "/weird/path"
    render(<Topbar />)
    expect(screen.getByText("Dashboard")).toBeTruthy()
  })
})
