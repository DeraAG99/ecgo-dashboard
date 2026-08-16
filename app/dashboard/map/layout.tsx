import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Peta Cabinet - ECGO Swap",
  description: "Lokasi dan status semua cabinet di peta",
}

export default function MapLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
