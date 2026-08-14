import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import StatusBadge from "./StatusBadge"

describe("StatusBadge", () => {
  it("should render ONLINE badge", () => {
    render(<StatusBadge status="ONLINE" />)
    const badge = screen.getByText("ONLINE")
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain("bg-full/10")
  })

  it("should render OFFLINE badge", () => {
    render(<StatusBadge status="OFFLINE" />)
    const badge = screen.getByText("OFFLINE")
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain("bg-offline/10")
  })

  it("should render MAINTENANCE badge", () => {
    render(<StatusBadge status="MAINTENANCE" />)
    expect(screen.getByText("MAINTENANCE")).toBeInTheDocument()
  })

  it("should render slot states", () => {
    render(<StatusBadge status="FULL" />)
    expect(screen.getByText("FULL")).toBeInTheDocument()
    render(<StatusBadge status="CHARGING" />)
    expect(screen.getByText("CHARGING")).toBeInTheDocument()
    render(<StatusBadge status="FAULT" />)
    expect(screen.getByText("FAULT")).toBeInTheDocument()
  })

  it("should fall back to raw status label for unknown values", () => {
    render(<StatusBadge status="UNKNOWN" />)
    const badge = screen.getByText("UNKNOWN")
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain("bg-surface-container")
  })
})
