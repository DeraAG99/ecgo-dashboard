import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import AlertSeverityBadge from "./AlertSeverityBadge"

describe("AlertSeverityBadge", () => {
  it("renders CRITICAL label", () => {
    render(<AlertSeverityBadge severity="CRITICAL" />)
    expect(screen.getByText("CRITICAL")).toBeInTheDocument()
  })

  it("renders WARNING label", () => {
    render(<AlertSeverityBadge severity="WARNING" />)
    expect(screen.getByText("WARNING")).toBeInTheDocument()
  })

  it("renders INFO label", () => {
    render(<AlertSeverityBadge severity="INFO" />)
    expect(screen.getByText("INFO")).toBeInTheDocument()
  })

  it("falls back to INFO for unknown severity", () => {
    render(<AlertSeverityBadge severity="UNKNOWN" />)
    expect(screen.getByText("INFO")).toBeInTheDocument()
  })
})
