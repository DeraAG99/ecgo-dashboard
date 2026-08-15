"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/cabinets", label: "Cabinet List", icon: "battery_charging_full" },
  { href: "/dashboard/transactions", label: "Transactions", icon: "receipt_long" },
  { href: "/dashboard/checkins", label: "Check-in", icon: "location_on" },
  { href: "/maintenance", label: "Maintenance", icon: "build" },
  { href: "/settings", label: "Settings", icon: "settings" },
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

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

  return (
    <aside className="hidden md:flex flex-col h-full py-gutter px-4 bg-ecgo-blue text-white fixed left-0 top-0 w-sidebar-width shadow-md z-40 transition-all duration-200 ease-in-out">
      <div className="flex items-center gap-4 mb-8 px-4">
        <div className="w-10 h-10 bg-surface-container-lowest rounded-lg flex items-center justify-center text-ecgo-green font-bold font-mono text-xl">
          E
        </div>
        <div>
          <h1 className="font-headline-md text-white">ECGO Swap</h1>
          <p className="text-body-sm text-on-secondary/70">Operational Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.href)
                ? "border-l-4 border-ecgo-green bg-white/10 text-white font-bold"
                : "text-on-secondary/70 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
            }`}
          >
            <Icon name={item.icon} filled={isActive(item.href)} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-2 pt-4 border-t border-white/10">
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-ecgo-green text-white font-bold hover:opacity-90 transition-opacity">
          <Icon name="add" />
          Add Station
        </button>
        <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-secondary/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
          <Icon name="help" />
          Support
        </a>
        <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-secondary/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
          <Icon name="logout" />
          Sign Out
        </a>
      </div>
    </aside>
  )
}
