import type { Metadata } from "next"
import AlertList from "@/components/ui/Alert/AlertList"

export const metadata: Metadata = {
  title: "Notifikasi — ECGO Dashboard",
}

export default function AlertsPage() {
  return (
    <div>
      <AlertList />
    </div>
  )
}
