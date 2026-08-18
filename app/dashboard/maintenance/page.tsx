import type { Metadata } from "next"
import { Suspense } from "react"
import LoadingSpinner from "@/components/shared/LoadingSpinner"
import WorkOrderList from "@/components/ui/Maintenance/WorkOrderList"
import CabinetMaintenanceTable from "@/components/ui/Maintenance/CabinetMaintenanceTable"
import SlotMaintenanceTable from "@/components/ui/Maintenance/SlotMaintenanceTable"
import BatteryMaintenanceTable from "@/components/ui/Maintenance/BatteryMaintenanceTable"
import MaintenanceSummary from "@/components/ui/Maintenance/MaintenanceSummary"
import MaintenanceLog from "@/components/ui/Maintenance/MaintenanceLog"

export const metadata: Metadata = {
  title: "Maintenance — ECGO Dashboard",
  description: "Manajemen perawatan cabinet, slot, dan baterai.",
}

const TABS = [
  { id: "work-orders", label: "Work Order", icon: "assignment" },
  { id: "cabinets", label: "Cabinet", icon: "ev_station" },
  { id: "slots", label: "Slot", icon: "grid_view" },
  { id: "batteries", label: "Baterai", icon: "battery_20" },
  { id: "summary", label: "Ringkasan", icon: "query_stats" },
  { id: "log", label: "Log Aktivitas", icon: "history" },
] as const

export default async function MaintenancePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const activeTab = tab && TABS.some((t) => t.id === tab) ? (tab as (typeof TABS)[number]["id"]) : "work-orders"

  const render = (id: string) => {
    switch (id) {
      case "work-orders":
        return <WorkOrderList />
      case "cabinets":
        return <CabinetMaintenanceTable />
      case "slots":
        return <SlotMaintenanceTable />
      case "batteries":
        return <BatteryMaintenanceTable />
      case "summary":
        return <MaintenanceSummary />
      case "log":
        return <MaintenanceLog />
      default:
        return null
    }
  }

  const labelFor = (id: string) => TABS.find((t) => t.id === id)?.label ?? id

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-display text-on-surface">Maintenance</h2>
          <p className="text-body-lg text-on-surface-variant mt-1">
            Kelola work order, status cabinet, slot, dan kesehatan baterai.
          </p>
        </div>
        <span className="text-label-caps text-on-surface-variant">
          Halaman: {labelFor(activeTab)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 border-b border-outline-variant">
        {TABS.map((t) => {
          const active = activeTab === t.id
          return (
            <a
              key={t.id}
              href={`/maintenance?tab=${t.id}`}
              className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-body-sm font-medium transition-colors ${
                active
                  ? "border-ecgo-green text-ecgo-green"
                  : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </a>
          )
        })}
      </div>

      <Suspense key={activeTab} fallback={<LoadingSpinner />}>{render(activeTab)}</Suspense>
    </div>
  )
}
