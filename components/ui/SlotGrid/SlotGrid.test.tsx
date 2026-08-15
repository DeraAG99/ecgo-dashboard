import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import SlotGrid from "./SlotGrid"
import type { Slot } from "@/lib/schema"

function makeSlots(overrides: Partial<Slot>[] = []): Slot[] {
  const base: Slot[] = Array.from({ length: 12 }, (_, i) => ({
    id: `SL-${i + 1}`,
    cabinetId: "CB-001",
    slotNumber: i + 1,
    state: "EMPTY",
    soc: null,
    lastUpdated: null,
  }))

  for (const override of overrides) {
    const idx = (override.slotNumber ?? 1) - 1
    if (idx >= 0 && idx < base.length) {
      base[idx] = { ...base[idx], ...override } as Slot
    }
  }
  return base
}

describe("SlotGrid", () => {
  it("renders slot state and SOC", () => {
    const slots = makeSlots([
      { slotNumber: 1, state: "FULL", soc: 80 },
      { slotNumber: 2, state: "CHARGING", soc: 45 },
      { slotNumber: 3, state: "LOCKED", soc: 60 },
      { slotNumber: 4, state: "FAULT", soc: 30 },
    ])
    render(<SlotGrid slots={slots} />)

    expect(screen.getByText("80%")).toBeInTheDocument()
    expect(screen.getByText("45%")).toBeInTheDocument()
    expect(screen.getByText("FULL")).toBeInTheDocument()
    expect(screen.getByText("CHARGING")).toBeInTheDocument()
    expect(screen.getByText("LOCKED")).toBeInTheDocument()
    expect(screen.getByText("FAULT")).toBeInTheDocument()
  })

  it("renders EMPTY placeholder for missing or empty slots", () => {
    const slots = makeSlots([{ slotNumber: 5, state: "EMPTY", soc: null }])
    render(<SlotGrid slots={slots} />)

    expect(screen.getAllByText("--").length).toBeGreaterThan(0)
    expect(screen.getAllByText("EMPTY").length).toBeGreaterThan(0)
  })

  it("shows stale indicator and dims grid when stale is true", () => {
    const { container } = render(<SlotGrid slots={makeSlots()} stale />)

    expect(screen.getByText(/Cabinet OFFLINE/i)).toBeInTheDocument()
    const grid = container.querySelector(".grid.grid-cols-2")
    expect(grid).not.toBeNull()
    expect(grid?.className).toContain("opacity-60")
  })

  it("does not show stale indicator when stale is false", () => {
    render(<SlotGrid slots={makeSlots()} stale={false} />)

    expect(screen.queryByText(/Cabinet OFFLINE/i)).not.toBeInTheDocument()
  })
})
