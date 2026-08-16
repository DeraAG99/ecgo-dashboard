import type { Metadata } from "next"
import ForecastChart from "@/components/ui/Forecast/ForecastChart"

export const metadata: Metadata = {
  title: "Perkiraan Permintaan — ECGO Dashboard",
}

export default function ForecastPage() {
  return (
    <div>
      <ForecastChart />
    </div>
  )
}
