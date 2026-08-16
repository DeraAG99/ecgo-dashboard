import BatteryTable from "@/components/ui/Battery/BatteryTable"

export const metadata = {
  title: "Manajemen Baterai - ECGO Swap",
  description: "Pantau kondisi dan kesehatan semua baterai",
}

export default function BatteriesPage() {
  return <BatteryTable />
}
