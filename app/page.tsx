import CabinetTable from "@/components/ui/CabinetTable"

export const metadata = {
  title: "Daftar Cabinet - ECGO Dashboard",
  description: "Daftar semua cabinet battery swap",
}

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Daftar Cabinet
      </h1>
      <CabinetTable />
    </div>
  )
}