"use client"

import { usePathname } from "next/navigation"
import AlertBell from "@/components/ui/Alert/AlertBell"

const TITLES: { match: string; title: string }[] = [
  { match: "/dashboard/cabinets/", title: "Cabinet List" },
  { match: "/dashboard/cabinets", title: "Cabinet List" },
  { match: "/dashboard/transactions", title: "Transactions" },
  { match: "/dashboard/map", title: "Map" },
  { match: "/dashboard/batteries/", title: "Batteries" },
  { match: "/dashboard/batteries", title: "Batteries" },
  { match: "/dashboard/alerts", title: "Notifications" },
  { match: "/dashboard/forecast", title: "Forecast" },
  { match: "/dashboard", title: "Dashboard" },
  { match: "/maintenance", title: "Maintenance" },
  { match: "/settings", title: "Settings" },
]

function Icon({ name, filled = false }: { name: string; filled?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "fill" : ""}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : undefined }}
    >
      {name}
    </span>
  )
}

export default function Topbar() {
  const pathname = usePathname()

  const matched = TITLES.find((t) =>
    t.match === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(t.match)
  )
  const title = matched?.title ?? "Dashboard"
  const isDetail =
    pathname.startsWith("/dashboard/cabinets/") && pathname !== "/dashboard/cabinets"

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-260px)] h-16 bg-surface-container-lowest border-b border-outline-variant shadow-sm z-30 flex items-center justify-between px-gutter">
      <div className="flex items-center gap-4 text-on-surface-variant">
        <span className="material-symbols-outlined cursor-pointer md:hidden">menu</span>
        <nav aria-label="Breadcrumb" className="flex text-body-sm">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <span className="text-on-surface-variant">{title}</span>
            </li>
            {isDetail && (
              <li>
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                  <span className="text-primary font-medium">Detail</span>
                </div>
              </li>
            )}
          </ol>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-primary font-medium text-body-sm flex items-center gap-2 hover:opacity-80 transition-opacity hidden md:flex">
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh Data
        </button>
        <div className="flex items-center gap-3 border-l border-outline-variant pl-4">
          <AlertBell />
          <Icon name="account_circle" />
        </div>
      </div>
    </header>
  )
}
